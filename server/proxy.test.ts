import { afterEach, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";
import { createServer, request as httpRequest } from "node:http";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { defaultConfig, emptyBrief } from "../src/domain";
import { outputSamples } from "../src/engine";
import { createApp } from "./index";
import { isPublicAddress, resolveTarget } from "./proxy";
import type { ProxyOptions, UpstreamFetch } from "./proxy";

const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
          server.closeAllConnections();
        }),
    ),
  );
  vi.useRealTimers();
});

function upstream(content: string, finish = "stop") {
  return new Response(
    JSON.stringify({
      choices: [{ message: { content }, finish_reason: finish }],
    }),
  );
}
const resolver = async () => [{ address: "93.184.216.34", family: 4 }];
const brief = {
  ...emptyBrief,
  name: "新品项目",
  brand: "青禾",
  product: "气泡水",
  audience: "城市人群",
};
const config = {
  ...defaultConfig,
  mock: false,
  apiKey: "browser-session-secret",
  baseUrl: "https://model.example/v1",
};

async function setup(options: ProxyOptions = {}) {
  const server = createApp({ env: {}, resolver, ...options }).listen(
    0,
    "127.0.0.1",
  );
  servers.push(server);
  await once(server, "listening");
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return {
    base,
    post: (path: string, body: unknown, headers: Record<string, string> = {}) =>
      fetch(`${base}/api/${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: base,
          ...headers,
        },
        body: JSON.stringify(body),
      }),
  };
}

function generation(extra: Record<string, unknown> = {}) {
  return {
    step: "positioning",
    brief,
    previous: {},
    projectId: "p-123",
    config,
    ...extra,
  };
}

describe("SSRF target policy", () => {
  it.each([
    "10.0.0.1",
    "127.0.0.1",
    "169.254.169.254",
    "172.16.2.1",
    "192.168.1.1",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "198.18.0.1",
    "192.0.2.1",
    "::",
    "::1",
    "fc00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "2001:db8::1",
    "2001:2::1",
    "3fff::1",
    "2002:7f00:1::",
  ])("blocks non-public %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it.each([
    "https://user:pass@api.example/v1",
    "file:///etc/passwd",
    "ftp://api.example",
    "http://127.1",
    "http://2130706433",
    "http://0x7f000001",
    "http://[::ffff:127.0.0.1]",
    "https://api.example/v1?key=secret",
    "http://metadata.google.internal",
  ])("rejects unsafe URL %s", async (address) => {
    await expect(resolveTarget(address, false, resolver)).rejects.toThrow();
  });

  it("resolves every address, rejects mixed/private DNS and only permits explicit loopback opt-in", async () => {
    expect(isPublicAddress("8.8.8.8")).toBe(true);
    expect(isPublicAddress("2606:4700:4700::1111")).toBe(true);
    await expect(
      resolveTarget("http://api.example/v1", false, async () => [
        { address: "192.168.1.2", family: 4 },
      ]),
    ).rejects.toThrow();
    await expect(
      resolveTarget("https://api.example/v1", false, async () => [
        ...(await resolver()),
        { address: "::1", family: 6 },
      ]),
    ).rejects.toThrow();
    await expect(
      resolveTarget("http://127.0.0.1:1111/v1", true),
    ).resolves.toHaveProperty("url.pathname", "/v1/chat/completions");
    await expect(
      resolveTarget("http://192.168.1.1/v1", true),
    ).rejects.toThrow();
    await expect(
      resolveTarget("http://public.example/v1", true, async () => [
        { address: "127.0.0.1", family: 4 },
      ]),
    ).rejects.toThrow();
    await expect(
      resolveTarget("https://api.example/v1/", false, resolver),
    ).resolves.toHaveProperty("url.pathname", "/v1/chat/completions");
  });

  it.each([false, true])(
    "blocks public HTTP even with allowLocal=%s",
    async (allowLocal) => {
      await expect(
        resolveTarget("http://api.example/v1", allowLocal, resolver),
      ).rejects.toMatchObject({ code: "INVALID_TARGET" });
      await expect(
        resolveTarget("http://8.8.8.8/v1", allowLocal),
      ).rejects.toMatchObject({ code: "INVALID_TARGET" });
      await expect(
        resolveTarget("http://[2606:4700:4700::1111]/v1", allowLocal),
      ).rejects.toMatchObject({ code: "INVALID_TARGET" });
    },
  );

  it("permits HTTP only for opted-in loopback names and literals", async () => {
    for (const baseUrl of [
      "http://127.0.0.1/v1",
      "http://[::1]/v1",
      "http://localhost/v1",
    ]) {
      const loopbackResolver = async () => [
        { address: "127.0.0.1", family: 4 },
        { address: "::1", family: 6 },
      ];
      await expect(
        resolveTarget(baseUrl, false, loopbackResolver),
      ).rejects.toMatchObject({ code: "INVALID_TARGET" });
      await expect(
        resolveTarget(baseUrl, true, loopbackResolver),
      ).resolves.toHaveProperty("url.pathname", "/v1/chat/completions");
    }
    await expect(
      resolveTarget("http://localhost/v1", true, resolver),
    ).rejects.toMatchObject({ code: "INVALID_TARGET" });
  });
});

describe("local proxy API", () => {
  it.each(["test", "generate"])(
    "rejects browser and server-configured public HTTP before sending any bearer key on /%s",
    async (path) => {
      for (const env of [
        {},
        { ALLOW_LOCAL_AI: "true" },
        {
          AI_API_KEY: "SERVER_SECRET",
          AI_BASE_URL: "http://api.example/v1",
          ALLOW_LOCAL_AI: "true",
        },
      ]) {
        const fake = vi.fn<UpstreamFetch>();
        const { post } = await setup({ env, fetch: fake });
        const unsafeConfig = { ...config, baseUrl: "http://api.example/v1" };
        const response = await post(
          path,
          path === "test"
            ? { config: unsafeConfig }
            : generation({ config: unsafeConfig }),
        );
        expect(response.status).toBe(400);
        const body = await response.text();
        expect(JSON.parse(body)).toMatchObject({ code: "INVALID_TARGET" });
        expect(body).not.toMatch(/SERVER_SECRET|browser-session-secret/);
        expect(fake).not.toHaveBeenCalled();
      }
    },
  );

  it("reports status without exposing secrets or base URL", async () => {
    const { base } = await setup({
      env: { AI_API_KEY: "SERVER_SECRET", AI_MODEL: "configured-model" },
    });
    const response = await fetch(`${base}/api/status`);
    expect(await response.json()).toEqual({
      configured: true,
      model: "configured-model",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("reports the same effective model used for requests, including fallback and invalid env", async () => {
    const noKey = await setup({ env: { AI_MODEL: "unused-env-model" } });
    expect(await (await fetch(`${noKey.base}/api/status`)).json()).toEqual({
      configured: false,
      model: defaultConfig.model,
    });
    const withKey = await setup({
      env: { AI_API_KEY: "server-key" },
      fetch: async () => upstream('{"ok":true}'),
    });
    expect(await (await fetch(`${withKey.base}/api/status`)).json()).toEqual({
      configured: true,
      model: defaultConfig.model,
    });
    expect(await (await withKey.post("test", { config })).json()).toEqual({
      model: defaultConfig.model,
      mode: "live",
    });
    const invalid = await setup({
      env: { AI_API_KEY: "server-key", AI_MODEL: "invalid model!" },
    });
    const status = await fetch(`${invalid.base}/api/status`);
    expect(status.status).toBe(503);
    expect(await status.json()).toMatchObject({ code: "INVALID_REQUEST" });
    expect((await invalid.post("test", { config })).status).toBe(503);
  });

  it("keeps unknown API paths JSON 404 in production instead of serving the SPA", async () => {
    const { base, post } = await setup({ env: { NODE_ENV: "production" } });
    const response = await fetch(`${base}/api/unknown`, {
      headers: { Accept: "text/html" },
    });
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toMatchObject({ code: "NOT_FOUND" });
    expect((await post("missing", {})).status).toBe(404);
  });

  it("allows same-origin Vite forwarded requests but not direct cross-origin browser calls", async () => {
    const fake = vi
      .fn<UpstreamFetch>()
      .mockImplementation(async () => upstream('{"ok":true}'));
    const { post } = await setup({ fetch: fake });
    expect(
      (
        await post(
          "test",
          { config },
          { Origin: "http://127.0.0.1:5173", "Sec-Fetch-Site": "same-origin" },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await post(
          "test",
          { config },
          { Origin: "http://localhost:5173", "Sec-Fetch-Site": "same-origin" },
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await post(
          "test",
          { config },
          { Origin: "http://127.0.0.1:5173", "Sec-Fetch-Site": "same-site" },
        )
      ).status,
    ).toBe(403);
    const prod = await setup({ env: { NODE_ENV: "production" }, fetch: fake });
    expect(
      (
        await prod.post(
          "test",
          { config },
          { Origin: "http://127.0.0.1:5173", "Sec-Fetch-Site": "same-origin" },
        )
      ).status,
    ).toBe(403);
    expect(fake).toHaveBeenCalledTimes(2);
  });

  it.each(Object.entries(outputSamples))(
    "validates mocked compatible upstream %s end to end",
    async (step, sample) => {
      const fake = vi
        .fn<UpstreamFetch>()
        .mockImplementation(async () =>
          upstream(JSON.stringify({ [step]: sample })),
        );
      const { post } = await setup({ fetch: fake });
      const response = await post("generate", generation({ step }));
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(Object.keys(body.solution)).toEqual([step]);
      const request = JSON.parse(fake.mock.calls[0][1].body);
      expect(request.messages[0].content).toContain(
        JSON.stringify({ [step]: sample }),
      );
      expect(request.messages[0].content).not.toContain(brief.name);
      expect(JSON.parse(request.messages[1].content)).toMatchObject({
        brief,
        projectId: "p-123",
      });
    },
  );

  it("uses the server configuration exclusively when a server key exists", async () => {
    const fake = vi
      .fn<UpstreamFetch>()
      .mockImplementation(async () =>
        upstream(JSON.stringify({ positioning: outputSamples.positioning })),
      );
    const { post } = await setup({
      fetch: fake,
      env: {
        AI_API_KEY: "SERVER_SECRET",
        AI_MODEL: "server-model",
        AI_BASE_URL: "https://server.example/v1",
        AI_MAX_TOKENS: "900",
        AI_TEMPERATURE: "0.3",
        AI_TIMEOUT: "10",
      },
    });
    const response = await post(
      "generate",
      generation({
        config: {
          ...config,
          baseUrl: "http://127.0.0.1/steal",
          model: "browser-model",
          apiKey: "ignored-key",
        },
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      solution: { positioning: outputSamples.positioning },
      model: "server-model",
      mode: "live",
    });
    expect(fake.mock.calls[0][0]).toBe(
      "https://server.example/v1/chat/completions",
    );
    const init = fake.mock.calls[0][1];
    expect(init.headers.Authorization).toBe("Bearer SERVER_SECRET");
    expect(init.redirect).toBe("error");
    expect(JSON.parse(init.body)).toMatchObject({
      model: "server-model",
      max_tokens: 900,
      temperature: 0.3,
      response_format: { type: "json_object" },
    });
    expect(init.body).not.toContain("ignored-key");
  });

  it.each<Record<string, string>>([
    { Origin: "https://evil.example" },
    { Origin: "null" },
    { Origin: "http://localhost:8787" },
    { "Sec-Fetch-Site": "cross-site" },
    { "Sec-Fetch-Site": "same-site" },
  ])(
    "rejects cross-origin mutation %j before contacting upstream",
    async (headers) => {
      const fake = vi.fn<UpstreamFetch>();
      const { post } = await setup({ fetch: fake });
      const response = await post("test", { config }, headers);
      expect(response.status).toBe(403);
      expect(fake).not.toHaveBeenCalled();
    },
  );

  it("rejects forged Host headers used by DNS rebinding", async () => {
    const fake = vi.fn<UpstreamFetch>();
    const { base } = await setup({ fetch: fake });
    const status = await new Promise<number | undefined>((resolve, reject) => {
      const request = httpRequest(
        `${base}/api/test`,
        {
          method: "POST",
          headers: {
            Host: "evil.example",
            Origin: "http://evil.example",
            "Content-Type": "application/json",
          },
        },
        (response) => {
          response.resume();
          resolve(response.statusCode);
        },
      );
      request.on("error", reject);
      request.end(JSON.stringify({ config }));
    });
    expect(status).toBe(403);
    expect(fake).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON, content type, excessive request size and malformed schemas", async () => {
    const fake = vi.fn<UpstreamFetch>();
    const { base, post } = await setup({ fetch: fake });
    expect(
      (await post("test", { config }, { "Content-Type": "text/plain" })).status,
    ).toBe(415);
    expect(
      (
        await fetch(`${base}/api/test`, {
          method: "POST",
          headers: { Origin: base, "Content-Type": "application/json" },
          body: "{",
        })
      ).status,
    ).toBe(400);
    expect(
      (await post("test", { config, data: "x".repeat(530000) })).status,
    ).toBe(413);
    expect(
      (await post("generate", generation({ brief: { ...brief, budget: 0 } })))
        .status,
    ).toBe(400);
    expect(
      (await post("generate", generation({ step: "unknown" }))).status,
    ).toBe(400);
    expect(
      (
        await post(
          "generate",
          generation({
            previous: { positioning: { message: "missing field" } },
          }),
        )
      ).status,
    ).toBe(400);
    expect(fake).not.toHaveBeenCalled();
  });

  it.each([
    { maxTokens: 16385 },
    { model: "../unsafe model" },
    { timeout: 181 },
    { temperature: 3 },
    { apiKey: "header\r\ninjection" },
  ])("rejects parameter limit violations %j", async (overrides) => {
    const fake = vi.fn<UpstreamFetch>();
    const { post } = await setup({ fetch: fake });
    const response = await post("test", {
      config: { ...config, ...overrides },
    });
    expect(response.status).toBe(400);
    expect(fake).not.toHaveBeenCalled();
  });

  it("never uses a prior browser key on subsequent requests and does not require a key for validate", async () => {
    const fake = vi
      .fn<UpstreamFetch>()
      .mockImplementation(async () => upstream('{"ok":true}'));
    const { post } = await setup({ fetch: fake });
    expect((await post("test", { config })).status).toBe(200);
    const missing = await post("test", { config: { ...config, apiKey: "" } });
    expect(missing.status).toBe(400);
    expect(await missing.json()).toMatchObject({ code: "CONFIG_REQUIRED" });
    expect(
      (await post("generate", generation({ step: "validate", config: {} })))
        .status,
    ).toBe(200);
    expect(fake).toHaveBeenCalledTimes(1);
  });

  it.each([301, 302, 307, 401, 429, 500])(
    "returns helpful sanitized 502 for upstream status %i without redirects",
    async (status) => {
      const fake = vi
        .fn<UpstreamFetch>()
        .mockImplementation(
          async () =>
            new Response("LEAKED_KEY stack trace", {
              status,
              headers: {
                "X-Secret": "LEAKED_HEADER",
                Location: "http://127.0.0.1/steal",
              },
            }),
        );
      const { post } = await setup({ fetch: fake });
      const response = await post("test", { config });
      expect(response.status).toBe(502);
      expect(await response.text()).not.toMatch(
        /LEAKED_KEY|LEAKED_HEADER|steal/,
      );
      expect(response.headers.get("x-secret")).toBeNull();
      expect(fake).toHaveBeenCalledTimes(1);
    },
  );

  it("handles refused, truncated, incomplete and invalid shapes without a Mock fallback", async () => {
    const fake = vi.fn<UpstreamFetch>();
    const { post } = await setup({ fetch: fake });
    for (const result of [
      upstream('{"positioning":{}}'),
      upstream('{"positioning":'),
      upstream("{}", "length"),
      new Response(
        JSON.stringify({
          choices: [{ message: { refusal: "LEAKED_REFUSAL" } }],
        }),
      ),
      new Response("INVALID_RESPONSE LEAKED_KEY"),
    ]) {
      fake.mockResolvedValueOnce(result);
      const response = await post("generate", generation());
      expect(response.status).toBe(502);
      expect(await response.text()).not.toMatch(/LEAKED/);
    }
  });

  it("redacts credentials echoed by the model, including escaped JSON", async () => {
    const secret = "browser-session-secret";
    const output = JSON.stringify({
      positioning: { positioning: `echo ${secret}`, message: `echo ${secret}` },
    }).replaceAll("browser", "\\u0062rowser");
    const { post } = await setup({ fetch: async () => upstream(output) });
    const response = await post("generate", generation());
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(body).not.toContain(secret);
    expect(body).toContain("[REDACTED]");
  });

  it("normalizes generated content ownership and review state", async () => {
    const { post } = await setup({
      fetch: async () =>
        upstream(
          JSON.stringify({
            contents: [
              {
                ...outputSamples.contents[0],
                projectId: "other-project",
                review: "已审核",
              },
            ],
          }),
        ),
    });
    const response = await post("generate", generation({ step: "contents" }));
    expect(response.status).toBe(200);
    expect((await response.json()).solution.contents[0]).toMatchObject({
      projectId: "p-123",
      review: "待审核",
      needsEdit: true,
    });
  });

  it("forces model-generated compliance resolution back to false", async () => {
    const { post } = await setup({
      fetch: async () =>
        upstream(
          JSON.stringify({
            compliance: [{ ...outputSamples.compliance[0], resolved: true }],
          }),
        ),
    });
    const response = await post("generate", generation({ step: "compliance" }));
    expect(response.status).toBe(200);
    expect((await response.json()).solution.compliance[0].resolved).toBe(false);
  });

  it("enforces response byte limits", async () => {
    const { post } = await setup({
      fetch: async () => new Response("x".repeat(1024 * 1024 + 1)),
    });
    const response = await post("test", { config });
    expect(response.status).toBe(502);
    expect(await response.json()).toMatchObject({ code: "UPSTREAM_TOO_LARGE" });
  });

  it("aborts timed out upstream work and returns 504 without exposing network errors", async () => {
    let signal: AbortSignal | undefined;
    const { post } = await setup({
      fetch: async (_url, init) => {
        signal = init.signal;
        return new Promise((_resolve, reject) =>
          init.signal.addEventListener(
            "abort",
            () => reject(new Error("NETWORK_SECRET")),
            { once: true },
          ),
        );
      },
    });
    const response = await post("test", { config: { ...config, timeout: 1 } });
    expect(response.status).toBe(504);
    expect(await response.json()).toMatchObject({ code: "TIMEOUT" });
    expect(signal?.aborted).toBe(true);
  });

  it("includes DNS resolution in the deadline and never sends late requests", async () => {
    const fake = vi.fn<UpstreamFetch>();
    const { post } = await setup({
      resolver: () => new Promise(() => undefined),
      fetch: fake,
    });
    const response = await post("test", { config: { ...config, timeout: 1 } });
    expect(response.status).toBe(504);
    expect(fake).not.toHaveBeenCalled();
  });

  it("does not follow redirects using the real native transport", async () => {
    let count = 0;
    const local = createServer((_req, res) => {
      count++;
      res.writeHead(307, { Location: "/private", "X-Key": "UPSTREAM_SECRET" });
      res.end("UPSTREAM_SECRET");
    }).listen(0, "127.0.0.1");
    servers.push(local);
    await once(local, "listening");
    const { post } = await setup({ env: { ALLOW_LOCAL_AI: "true" } });
    const response = await post("test", {
      config: {
        ...config,
        baseUrl: `http://127.0.0.1:${(local.address() as AddressInfo).port}/v1`,
      },
    });
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("UPSTREAM_SECRET");
    expect(count).toBe(1);
  });

  it("uses the pinned native transport against an explicitly allowed local test upstream", async () => {
    let receivedPath = "";
    const local = createServer((req, res) => {
      receivedPath = req.url || "";
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          choices: [
            { message: { content: '{"ok":true}' }, finish_reason: "stop" },
          ],
        }),
      );
    }).listen(0, "127.0.0.1");
    servers.push(local);
    await once(local, "listening");
    const baseUrl = `http://localhost:${(local.address() as AddressInfo).port}/v1`;
    const lookup = vi
      .fn()
      .mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
    const { post } = await setup({
      env: { ALLOW_LOCAL_AI: "true" },
      resolver: lookup,
    });
    const response = await post("test", { config: { ...config, baseUrl } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      model: config.model,
      mode: "live",
    });
    expect(receivedPath).toBe("/v1/chat/completions");
    expect(lookup).toHaveBeenCalledTimes(1);
  });
});
