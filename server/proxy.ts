import express from "express";
import type { ErrorRequestHandler, Request } from "express";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { z } from "zod";
import { defaultConfig, STEP_KEYS } from "../src/domain";
import {
  briefSchema,
  solutionSchema,
  createTaskMessages,
  parseStepOutput,
} from "../src/engine";
import type { GenerationStep } from "../src/engine";

const MAX_RESPONSE_BYTES = 1024 * 1024;
export const MAX_TOKENS = 16384;
const modelSchema = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:/@-]{0,127}$/);
const configSchema = z
  .object({
    provider: z.string().max(100).default("OpenAI Compatible"),
    baseUrl: z.string().max(2048).default(defaultConfig.baseUrl),
    apiKey: z
      .string()
      .max(4096)
      .refine((value) => !/[\r\n\x00]/.test(value))
      .default(""),
    model: modelSchema.default(defaultConfig.model),
    temperature: z.number().finite().min(0).max(2).default(0.7),
    maxTokens: z.number().int().min(1).max(MAX_TOKENS).default(6000),
    timeout: z.number().finite().min(1).max(180).default(90),
  })
  .strip();
const wireConfig = z.record(z.unknown()).default({});
const testRequestSchema = z.object({ config: wireConfig }).strict();
const generationRequestSchema = z
  .object({
    step: z.enum(STEP_KEYS),
    brief: briefSchema,
    previous: solutionSchema.default({}),
    projectId: z.string().trim().min(1).max(200),
    config: wireConfig,
  })
  .strict();
type ProxyConfig = z.infer<typeof configSchema>;
type Address = { address: string; family: number };
export type Resolver = (hostname: string) => Promise<Address[]>;
const systemResolver: Resolver = (hostname) =>
  lookup(hostname, { all: true, verbatim: true });

export class ProxyError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(
      a === 0 ||
      a === 10 ||
      a === 127 ||
      a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
      (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
      (a === 203 && b === 0 && c === 113)
    );
  }
  if (isIP(address) === 6) {
    // Only global unicast; exclude documentation, transition/tunnel ranges and mapped IPv4.
    const prefix = Number.parseInt(address.split(":")[0], 16);
    const normalized = new URL(`http://[${address}]/`).hostname.toLowerCase();
    const second = Number.parseInt(
      normalized.slice(1).split(":")[1] || "0",
      16,
    );
    return (
      prefix >= 0x2000 &&
      prefix < 0x3fff &&
      !(prefix === 0x2001 && (second < 0x200 || second === 0xdb8)) &&
      prefix !== 0x2002
    );
  }
  return false;
}

function isLoopback(address: string) {
  return (
    (isIP(address) === 4 && address.startsWith("127.")) || address === "::1"
  );
}

export async function resolveTarget(
  baseUrl: string,
  allowLocal = false,
  resolver: Resolver = systemResolver,
): Promise<{ url: URL; addresses: Address[] }> {
  const fail = () =>
    new ProxyError(
      400,
      "INVALID_TARGET",
      "公网 API 地址必须使用 HTTPS，且不得包含凭证或指向内网；HTTP 仅允许 ALLOW_LOCAL_AI=true 的本机回环地址。",
    );
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw fail();
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw fail();
  const hostname = url.hostname
    .replace(/^\[|\]$/g, "")
    .replace(/\.$/, "")
    .toLowerCase();
  if (!hostname || /[\s%]/.test(hostname)) throw fail();
  const localName = hostname === "localhost" || hostname.endsWith(".localhost");
  const localTarget = allowLocal && (localName || isIP(hostname) !== 0);
  if (localName && !allowLocal) throw fail();
  if (
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname === "metadata.google.internal"
  )
    throw fail();
  let addresses: Address[];
  try {
    addresses = isIP(hostname)
      ? [{ address: hostname, family: isIP(hostname) }]
      : await resolver(hostname);
  } catch {
    throw new ProxyError(
      502,
      "DNS_FAILED",
      "无法解析模型服务地址，请检查 API Base URL 和网络。",
    );
  }
  if (
    !addresses.length ||
    addresses.length > 32 ||
    addresses.some(
      (item) =>
        !isPublicAddress(item.address) &&
        !(localTarget && isLoopback(item.address)),
    )
  )
    throw fail();
  if (localName && addresses.some((item) => !isLoopback(item.address)))
    throw fail();
  if (
    url.protocol === "http:" &&
    !(localTarget && addresses.every((item) => isLoopback(item.address)))
  )
    throw fail();
  url.pathname = `${url.pathname.replace(/\/+$/, "")}/chat/completions`;
  return { url, addresses };
}

type UpstreamInit = {
  method: "POST";
  headers: Record<string, string>;
  body: string;
  signal: AbortSignal;
  redirect: "error";
};
export type UpstreamFetch = (
  url: string,
  init: UpstreamInit,
) => Promise<Response>;

// Pin the socket lookup to the validated DNS result, avoiding a second DNS lookup/rebinding.
async function pinnedFetch(
  url: URL,
  init: UpstreamInit,
  addresses: Address[],
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const address = addresses[0];
    const request = (url.protocol === "https:" ? httpsRequest : httpRequest)(
      url,
      {
        method: init.method,
        headers: init.headers,
        signal: init.signal,
        family: address.family,
        lookup: (_hostname, options, callback) => {
          if (options.all) callback(null, [address]);
          else callback(null, address.address, address.family);
        },
      },
      (response) => {
        const status = response.statusCode || 502;
        if (status < 200 || status >= 300) {
          // Discard errors and redirects without reading or reflecting upstream headers/bodies.
          response.destroy();
          resolve(new Response(null, { status }));
          return;
        }
        let size = 0;
        const chunks: Buffer[] = [];
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) {
            reject(
              new ProxyError(
                502,
                "UPSTREAM_TOO_LARGE",
                "模型响应过大，请缩小生成范围。",
              ),
            );
            response.destroy();
          } else chunks.push(chunk);
        });
        response.on("end", () =>
          resolve(
            new Response(Buffer.concat(chunks).toString("utf8"), { status }),
          ),
        );
        response.on("error", reject);
      },
    );
    request.on("error", reject);
    request.end(init.body);
  });
}

async function readLimited(response: Response): Promise<string> {
  if (!response.body)
    throw new ProxyError(502, "INVALID_OUTPUT", "模型未返回内容，请重试。");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new ProxyError(
          502,
          "UPSTREAM_TOO_LARGE",
          "模型响应过大，请缩小生成范围。",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf8");
}

function effectiveConfig(
  input: Record<string, unknown>,
  env: NodeJS.ProcessEnv,
): ProxyConfig {
  const serverKey = env.AI_API_KEY?.trim();
  const source = serverKey
    ? {
        baseUrl: env.AI_BASE_URL || defaultConfig.baseUrl,
        apiKey: serverKey,
        model: env.AI_MODEL || defaultConfig.model,
        temperature: env.AI_TEMPERATURE
          ? Number(env.AI_TEMPERATURE)
          : defaultConfig.temperature,
        maxTokens: env.AI_MAX_TOKENS
          ? Number(env.AI_MAX_TOKENS)
          : defaultConfig.maxTokens,
        timeout: env.AI_TIMEOUT
          ? Number(env.AI_TIMEOUT)
          : defaultConfig.timeout,
      }
    : input;
  const result = configSchema.safeParse(source);
  if (!result.success)
    throw new ProxyError(
      serverKey ? 503 : 400,
      "INVALID_REQUEST",
      "模型设置无效。请检查模型名称、温度（0–2）、Token（1–16384）和超时（1–180 秒）。",
    );
  if (!result.data.apiKey.trim())
    throw new ProxyError(
      400,
      "CONFIG_REQUIRED",
      "请在模型设置输入 API Key，或配置服务端 AI_API_KEY。",
    );
  return { ...result.data, apiKey: result.data.apiKey.trim() };
}

const completionSchema = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.string().nullable().optional(),
        message: z.object({
          content: z.string().nullable().optional(),
          refusal: z.string().nullable().optional(),
        }),
      }),
    )
    .min(1)
    .max(10),
});

function redact(value: string, secrets: string[]) {
  return secrets
    .filter(Boolean)
    .reduce((result, secret) => result.split(secret).join("[REDACTED]"), value);
}

export interface ProxyOptions {
  env?: NodeJS.ProcessEnv;
  fetch?: UpstreamFetch;
  resolver?: Resolver;
}

async function completion(
  config: ProxyConfig,
  messages: { role: string; content: string }[],
  options: ProxyOptions,
  test = false,
) {
  const env = options.env || process.env;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeout * 1000);
  let onAbort: (() => void) | undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    onAbort = () =>
      reject(
        new ProxyError(
          504,
          "TIMEOUT",
          "模型请求超时，请稍后重试或调整超时设置。",
        ),
      );
    controller.signal.addEventListener("abort", onAbort, { once: true });
  });
  const operation = async () => {
    const target = await resolveTarget(
      config.baseUrl,
      env.ALLOW_LOCAL_AI === "true",
      options.resolver,
    );
    if (controller.signal.aborted)
      throw new ProxyError(504, "TIMEOUT", "模型请求超时。");
    const init: UpstreamInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        temperature: test ? 0 : config.temperature,
        max_tokens: test ? 64 : config.maxTokens,
        response_format: { type: "json_object" },
        messages,
      }),
      signal: controller.signal,
      redirect: "error",
    };
    const response = await (options.fetch
      ? options.fetch(target.url.href, init)
      : pinnedFetch(target.url, init, target.addresses));
    if (!response.ok) {
      await response.body?.cancel();
      if (response.status === 401 || response.status === 403)
        throw new ProxyError(
          502,
          "UPSTREAM_AUTH",
          "模型鉴权失败，请检查 API Key 和模型访问权限。",
        );
      if (response.status === 429)
        throw new ProxyError(
          502,
          "UPSTREAM_RATE_LIMIT",
          "模型请求受限，请稍后重试并检查配额。",
        );
      throw new ProxyError(
        502,
        "UPSTREAM_ERROR",
        "模型服务请求失败。请检查 Base URL、模型名称和服务状态；不支持自动跟随重定向。",
      );
    }
    const raw = await readLimited(response);
    let decoded: unknown;
    try {
      decoded = JSON.parse(raw);
    } catch {
      throw new ProxyError(
        502,
        "INVALID_OUTPUT",
        "模型服务返回非 JSON 响应，请检查兼容接口地址。",
      );
    }
    const parsed = completionSchema.safeParse(decoded);
    if (!parsed.success)
      throw new ProxyError(
        502,
        "INVALID_OUTPUT",
        "模型服务响应不符合 Chat Completions 格式。",
      );
    const choice = parsed.data.choices[0];
    if (choice.finish_reason === "length")
      throw new ProxyError(
        502,
        "UPSTREAM_TRUNCATED",
        "模型输出被截断，请增加 Token 上限或缩小生成范围。",
      );
    if (
      choice.message.refusal ||
      (choice.finish_reason && choice.finish_reason !== "stop")
    )
      throw new ProxyError(
        502,
        "UPSTREAM_REFUSAL",
        "模型未完成任务或拒绝生成，请调整 Brief 后重试。",
      );
    if (!choice.message.content?.trim())
      throw new ProxyError(
        502,
        "INVALID_OUTPUT",
        "模型未返回有效内容，请重试。",
      );
    return choice.message.content;
  };
  try {
    return await Promise.race([operation(), aborted]);
  } catch (error) {
    if (controller.signal.aborted)
      throw new ProxyError(
        504,
        "TIMEOUT",
        "模型请求超时，请稍后重试或调整超时设置。",
      );
    if (error instanceof ProxyError) throw error;
    throw new ProxyError(
      502,
      "UPSTREAM_ERROR",
      "无法连接模型服务，请检查 Base URL、网络与模型设置。",
    );
  } finally {
    clearTimeout(timer);
    if (onAbort) controller.signal.removeEventListener("abort", onAbort);
  }
}

function sameOriginRequest(req: Request, env: NodeJS.ProcessEnv): boolean {
  const site = req.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return false;
  const host = req.get("host");
  if (!host) return false;
  let expected: URL;
  try {
    expected = new URL(`${req.protocol}://${host}`);
  } catch {
    return false;
  }
  if (
    !["localhost", "127.0.0.1", "[::1]"].includes(expected.hostname) ||
    expected.username ||
    expected.password ||
    expected.pathname !== "/" ||
    expected.search ||
    expected.hash
  )
    return false;
  const origin = req.get("origin");
  if (!origin)
    return (
      !req.get("sec-fetch-mode") || site === "same-origin" || site === "none"
    );
  try {
    const page = new URL(origin);
    if (page.origin === expected.origin) return true;
    // Vite's string proxy rewrites Host to :8787 but retains Origin and Fetch Metadata.
    // A direct cross-origin browser POST is still denied by Sec-Fetch-Site above.
    return (
      env.NODE_ENV !== "production" &&
      site === "same-origin" &&
      page.protocol === "http:" &&
      ["127.0.0.1", "localhost"].includes(page.hostname) &&
      page.port === "5173"
    );
  } catch {
    return false;
  }
}

export function createApiRouter(options: ProxyOptions = {}) {
  const router = express.Router();
  const env = options.env || process.env;
  router.use((_req, res, next) => {
    res.set({
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin",
    });
    next();
  });
  router.use((req, _res, next) => {
    if (!["GET", "HEAD"].includes(req.method) && !sameOriginRequest(req, env))
      return next(
        new ProxyError(403, "ORIGIN_DENIED", "仅允许本机页面的同源请求。"),
      );
    if (
      ["POST", "PUT", "PATCH"].includes(req.method) &&
      !req.is("application/json")
    )
      return next(
        new ProxyError(415, "JSON_REQUIRED", "请使用 application/json 请求。"),
      );
    next();
  });
  router.use(express.json({ limit: "512kb", strict: true }));
  router.get("/status", (_req, res) => {
    const configured = !!env.AI_API_KEY?.trim();
    const effective = configured ? effectiveConfig({}, env) : null;
    res.json({
      configured,
      model: effective
        ? redact(effective.model, [effective.apiKey])
        : defaultConfig.model,
    });
  });
  router.post("/test", async (req, res) => {
    const parsed = testRequestSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ProxyError(400, "INVALID_REQUEST", "连接测试请求格式错误。");
    const config = effectiveConfig(parsed.data.config, env);
    const output = await completion(
      config,
      [
        {
          role: "system",
          content:
            'Connection test. Respond with exactly one JSON object: {"ok":true}. Do not add other fields or text.',
        },
        { role: "user", content: "Return the connection test JSON object." },
      ],
      options,
      true,
    );
    try {
      z.object({ ok: z.literal(true) })
        .strict()
        .parse(JSON.parse(output));
    } catch {
      throw new ProxyError(
        502,
        "INVALID_OUTPUT",
        "模型未通过 JSON 连接测试，请确认支持 JSON mode。",
      );
    }
    res.json({ model: redact(config.model, [config.apiKey]), mode: "live" });
  });
  router.post("/generate", async (req, res) => {
    const parsed = generationRequestSchema.safeParse(req.body);
    if (!parsed.success)
      throw new ProxyError(
        400,
        "INVALID_REQUEST",
        "生成请求无效，请检查步骤、Brief 必填项、上一阶段结果和项目 ID。",
      );
    const { step, brief, previous, projectId } = parsed.data;
    if (step === "validate") {
      res.json({ solution: {} });
      return;
    }
    const config = effectiveConfig(parsed.data.config, env);
    const output = await completion(
      config,
      createTaskMessages(step, brief, previous, projectId),
      options,
    );
    let solution;
    const browserKey =
      typeof parsed.data.config.apiKey === "string"
        ? parsed.data.config.apiKey
        : "";
    try {
      // Redact after parsing too, so escaped JSON cannot conceal an echoed credential.
      solution = parseStepOutput(step as GenerationStep, output);
      if (solution.contents)
        solution.contents = solution.contents.map((item) => ({
          ...item,
          projectId,
          review: "待审核" as const,
        }));
      solution = parseStepOutput(
        step,
        JSON.stringify(solution, (_key, value) =>
          typeof value === "string"
            ? redact(value, [config.apiKey, browserKey])
            : value,
        ),
      );
    } catch (error) {
      throw new ProxyError(
        502,
        "INVALID_OUTPUT",
        error instanceof Error ? error.message : "模型输出结构错误，请重试。",
      );
    }
    res.json({
      solution,
      model: redact(config.model, [config.apiKey, browserKey]),
      mode: "live",
    });
  });
  router.use((_req, _res, next) =>
    next(new ProxyError(404, "NOT_FOUND", "接口不存在。")),
  );
  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (error instanceof ProxyError) {
      res.status(error.status).json({ code: error.code, error: error.message });
      return;
    }
    if (error?.type === "entity.too.large") {
      res
        .status(413)
        .json({
          code: "REQUEST_TOO_LARGE",
          error: "请求过大，请减少 Brief 或已有方案内容。",
        });
      return;
    }
    if (error instanceof SyntaxError) {
      res
        .status(400)
        .json({ code: "INVALID_REQUEST", error: "请求不是有效 JSON。" });
      return;
    }
    res
      .status(500)
      .json({
        code: "INTERNAL_ERROR",
        error: "本地代理发生错误，请检查服务端配置。",
      });
  };
  router.use(errorHandler);
  return router;
}
