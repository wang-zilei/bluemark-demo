import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultConfig, emptyBrief, newSteps, STEP_KEYS } from "./domain";
import type { Brief, ContentItem, Project } from "./domain";
import {
  createTaskMessages,
  generateStep,
  outputSamples,
  parseStepOutput,
  testConnection,
  validateBrief,
  validateStepOutput,
} from "./engine";

function validBrief(): Brief {
  return {
    ...emptyBrief,
    name: "新品首发",
    brand: "青禾",
    product: "无糖气泡水",
    audience: "城市通勤人群",
  };
}

function project(): Project {
  return {
    id: "test-project",
    brief: validBrief(),
    status: "草稿",
    createdAt: "2026-10-17",
    updatedAt: "2026-10-17",
    model: "mock",
    isCase: false,
    favorite: false,
    isExample: false,
    reviewedModules: [],
    solution: {},
    steps: newSteps(),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("Brief contract", () => {
  it("reports all required fields without rejecting optional empty fields", () => {
    expect(validateBrief(validBrief())).toEqual([]);
    expect(
      validateBrief({
        ...emptyBrief,
        goals: [],
        platforms: [],
        budget: 0,
        duration: -1,
      }),
    ).toHaveLength(8);
    expect(
      validateBrief({
        ...validBrief(),
        name: "   ",
        budget: NaN,
        goals: [" "],
      }),
    ).toHaveLength(3);
  });

  it("validates every step before generating and never invokes a provider for validate", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    await expect(
      generateStep(project(), "validate", { ...defaultConfig, mock: false }),
    ).resolves.toEqual({});
    await expect(
      generateStep(
        { ...project(), brief: { ...validBrief(), brand: " " } },
        "audience",
        defaultConfig,
      ),
    ).rejects.toThrow("品牌");
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("structured output", () => {
  it.each(Object.entries(outputSamples))(
    "accepts complete %s and rejects missing fields",
    (step, sample) => {
      const key = step as keyof typeof outputSamples;
      expect(validateStepOutput(key, { [key]: sample })).toEqual({
        [key]: sample,
      });
      const broken = structuredClone(sample);
      if (Array.isArray(broken))
        delete (broken[0] as Record<string, unknown>).id;
      else delete (broken as Record<string, unknown>)[Object.keys(broken)[0]];
      // Not every array item has an id. Removing the first actual field must fail.
      if (Array.isArray(broken))
        delete (broken[0] as Record<string, unknown>)[
          Object.keys(broken[0])[0]
        ];
      expect(() => validateStepOutput(key, { [key]: broken })).toThrow(
        "输出字段缺失或格式错误",
      );
    },
  );

  it("parses JSON and bounded formatting recovery, never truncation or wrong modules", () => {
    expect(
      parseStepOutput(
        "positioning",
        '```json\n{"positioning":{"positioning":"人群定位","message":"信息"}}\n```',
      ),
    ).toHaveProperty("positioning.message", "信息");
    expect(
      parseStepOutput(
        "positioning",
        "{positioning:{positioning:'人群定位',message:'信息',},}",
      ),
    ).toHaveProperty("positioning.message", "信息");
    expect(() =>
      parseStepOutput("positioning", '{"positioning":{"message":"缺少定位"}}'),
    ).toThrow("positioning");
    expect(() => parseStepOutput("quality", '{"quality":')).toThrow(
      "完整 JSON",
    );
    expect(() =>
      parseStepOutput(
        "positioning",
        '{"positioning":{"positioning":"p","message":"unterminated}}',
      ),
    ).toThrow("完整 JSON");
    expect(() =>
      parseStepOutput(
        "positioning",
        '{"positioning":{"positioning":"p","message":"m"}',
      ),
    ).toThrow("完整 JSON");
    expect(() =>
      parseStepOutput("quality", 'explanation {"quality":{}}'),
    ).toThrow("完整 JSON");
    expect(() =>
      parseStepOutput(
        "audience",
        JSON.stringify({ quality: outputSamples.quality }),
      ),
    ).toThrow();
    expect(() =>
      parseStepOutput(
        "quality",
        JSON.stringify({ quality: { ...outputSamples.quality, score: 101 } }),
      ),
    ).toThrow();
    expect(() =>
      parseStepOutput(
        "matrix",
        JSON.stringify({
          matrix: [{ ...outputSamples.matrix[0], quantity: "3" }],
        }),
      ),
    ).toThrow();
    expect(() =>
      parseStepOutput(
        "contents",
        JSON.stringify({
          contents: [{ ...outputSamples.contents[0], owner: undefined }],
        }),
      ),
    ).toThrow();
  });

  it("keeps untrusted brief text in the user message, not the system", () => {
    const messages = createTaskMessages(
      "market",
      { ...validBrief(), requirements: "UNTRUSTED_INSTRUCTION" },
      {},
      "project",
    );
    expect(messages[0].content).not.toContain("UNTRUSTED_INSTRUCTION");
    expect(messages[1].content).toContain("UNTRUSTED_INSTRUCTION");
    expect(messages[0].content).toContain("JSON");
    expect(messages[0].content).toContain("limitations");
  });

  it("never lets generated data impersonate human review or risk resolution", () => {
    const contents = validateStepOutput("contents", {
      contents: [
        { ...outputSamples.contents[0], review: "已审核", needsEdit: false },
      ],
    });
    expect(contents.contents?.[0]).toMatchObject({
      review: "待审核",
      needsEdit: true,
    });
    const compliance = validateStepOutput("compliance", {
      compliance: [{ ...outputSamples.compliance[0], resolved: true }],
    });
    expect(compliance.compliance?.[0].resolved).toBe(false);
  });
});

describe("providers", () => {
  it("makes Mock results dynamic and returns only the requested module after a real delay", async () => {
    vi.useFakeTimers();
    const request = generateStep(project(), "positioning", defaultConfig);
    let settled = false;
    void request.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );
    await vi.advanceTimersByTimeAsync(199);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(202);
    const result = await request;
    expect(Object.keys(result)).toEqual(["positioning"]);
    expect(result.positioning).toBeDefined();
    const other = generateStep(
      {
        ...project(),
        brief: {
          ...validBrief(),
          brand: "海蓝",
          product: "便携咖啡",
          audience: "露营人群",
        },
      },
      "positioning",
      defaultConfig,
    );
    await vi.advanceTimersByTimeAsync(401);
    expect(await other).not.toEqual(result);
  });

  it("validates all modules produced by the actual shared data adapter", async () => {
    vi.useFakeTimers();
    const pending = Promise.all(
      STEP_KEYS.map((step) => generateStep(project(), step, defaultConfig)),
    );
    void pending.catch(() => undefined);
    await vi.advanceTimersByTimeAsync(401);
    const results = await pending;
    expect(results).toHaveLength(STEP_KEYS.length);
    expect(results[0]).toEqual({});
  });

  it("tests Mock locally without contacting any endpoint", async () => {
    vi.useFakeTimers();
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const result = testConnection(defaultConfig);
    await vi.advanceTimersByTimeAsync(401);
    await expect(result).resolves.toEqual({
      model: defaultConfig.model,
      mode: "mock",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("uses the compatible proxy for DeepSeek/custom without persisting a key", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            solution: { positioning: outputSamples.positioning },
          }),
          { status: 200 },
        ),
      );
    const storage = { setItem: vi.fn() };
    vi.stubGlobal("fetch", fetch);
    vi.stubGlobal("localStorage", storage);
    const config = {
      ...defaultConfig,
      mock: false,
      provider: "DeepSeek",
      apiKey: "session-secret",
    };
    await expect(
      generateStep(project(), "positioning", config),
    ).resolves.toEqual({ positioning: outputSamples.positioning });
    expect(fetch).toHaveBeenCalledWith(
      "/api/generate",
      expect.objectContaining({ method: "POST", redirect: "error" }),
    );
    const payload = JSON.parse(fetch.mock.calls[0][1].body);
    expect(payload).toMatchObject({
      projectId: "test-project",
      previous: {},
      brief: validBrief(),
      config: { apiKey: "session-secret" },
    });
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("never falls back to Mock on an HTTP failure or invalid output; hides raw error bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ code: "UPSTREAM_AUTH", error: "LEAKED_KEY" }),
            { status: 502 },
          ),
        ),
    );
    await expect(
      generateStep(project(), "market", { ...defaultConfig, mock: false }),
    ).rejects.toThrow("鉴权失败");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ solution: { market: {} } })),
        ),
    );
    await expect(
      generateStep(project(), "market", { ...defaultConfig, mock: false }),
    ).rejects.toThrow("market");
  });

  it("validates compatible connection test response", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ model: "deepseek-chat", mode: "live" }),
          ),
        ),
    );
    await expect(
      testConnection({ ...defaultConfig, mock: false }),
    ).resolves.toEqual({ model: "deepseek-chat", mode: "live" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}")));
    await expect(
      testConnection({ ...defaultConfig, mock: false }),
    ).rejects.toThrow("无效");
  });

  it("aborts a browser request instead of leaving loading state pending indefinitely", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_path, init) => {
        signal = init.signal;
        return new Promise((_resolve, reject) =>
          signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          ),
        );
      }),
    );
    const pending = testConnection({
      ...defaultConfig,
      mock: false,
      timeout: 1,
    });
    const assertion = expect(pending).rejects.toThrow("超时");
    await vi.advanceTimersByTimeAsync(6001);
    await assertion;
    expect(signal?.aborted).toBe(true);
  });
});

describe("generated content identity and audit metadata", () => {
  const generated = (overrides: Record<string, unknown> = {}) => ({
    ...outputSamples.contents[0],
    ...overrides,
  });
  function mockContents(contents: unknown[]) {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(
          async () => new Response(JSON.stringify({ solution: { contents } })),
        ),
    );
  }

  it("repairs missing or duplicate IDs and malformed audit dates during parsing", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T12:00:00Z"));
    const source = [
      generated({
        id: "duplicate",
        createdAt: "not-a-date",
        updatedAt: "2026-02-30T12:00:00Z",
      }),
      generated({ id: "duplicate" }),
      generated({ id: undefined, createdAt: undefined, updatedAt: undefined }),
    ];
    const result = parseStepOutput(
      "contents",
      JSON.stringify({ contents: source }),
    ).contents!;
    expect(new Set(result.map((item) => item.id)).size).toBe(3);
    expect(result[2].id).toMatch(/^content-[a-f0-9-]{36}$/);
    expect(result[0]).toMatchObject({
      createdAt: "2026-10-18T12:00:00.000Z",
      updatedAt: "2026-10-18T12:00:00.000Z",
      review: "待审核",
      needsEdit: true,
    });
    expect(result[2].createdAt).toBe("2026-10-18T12:00:00.000Z");
    expect(
      parseStepOutput("contents", JSON.stringify({ contents: result }))
        .contents,
    ).toEqual(result);
  });

  it("assigns globally unique app IDs and actual audit time to new model content", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T12:00:00Z"));
    mockContents([
      generated({
        id: "content-1",
        projectId: "foreign",
        createdAt: "1999-01-01T00:00:00Z",
        updatedAt: "2099-01-01T00:00:00Z",
        review: "已审核",
        needsEdit: false,
      }),
      generated({ id: "content-1" }),
      generated({ id: undefined, createdAt: undefined, updatedAt: undefined }),
    ]);
    const p = project();
    const snapshot = structuredClone(p);
    const result = (
      await generateStep(p, "contents", { ...defaultConfig, mock: false })
    ).contents!;
    const other = (
      await generateStep({ ...project(), id: "another-project" }, "contents", {
        ...defaultConfig,
        mock: false,
      })
    ).contents!;
    expect(new Set([...result, ...other].map((item) => item.id)).size).toBe(6);
    expect(result.every((item) => item.id !== "content-1")).toBe(true);
    for (const item of result)
      expect(item).toMatchObject({
        projectId: p.id,
        createdAt: "2026-10-18T12:00:00.000Z",
        updatedAt: "2026-10-18T12:00:00.000Z",
        review: "待审核",
        needsEdit: true,
      });
    expect(p).toEqual(snapshot);
  });

  it("preserves existing app identity and actual createdAt, never a model override", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T12:00:00Z"));
    const p = project();
    const original: ContentItem = {
      ...outputSamples.contents[0],
      id: "existing-row",
      projectId: p.id,
      platform: "小红书",
      createdAt: "2026-10-17T09:30:00+08:00",
      updatedAt: "2026-10-17T09:30:00+08:00",
      review: "已审核",
      needsEdit: false,
    };
    p.solution = { contents: [original] };
    mockContents([
      generated({
        id: original.id,
        createdAt: "2000-01-01T00:00:00Z",
        projectId: "foreign",
      }),
      generated({ id: original.id }),
    ]);
    const result = (
      await generateStep(p, "contents", { ...defaultConfig, mock: false })
    ).contents!;
    expect(result[0]).toMatchObject({
      id: original.id,
      projectId: p.id,
      createdAt: original.createdAt,
      updatedAt: "2026-10-18T12:00:00.000Z",
      review: "待审核",
      needsEdit: true,
    });
    expect(result[1].id).not.toBe(original.id);
    expect(result[1].createdAt).toBe("2026-10-18T12:00:00.000Z");
    expect(p.solution.contents?.[0]).toEqual(original);
  });

  it("does not recover identity or createdAt from another project or ambiguous previous IDs", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-18T12:00:00Z"));
    const p = project();
    const item: ContentItem = {
      ...outputSamples.contents[0],
      id: "duplicate",
      projectId: p.id,
      platform: "小红书",
      review: "待审核",
    };
    p.solution = {
      contents: [
        item,
        { ...item },
        { ...item, id: "foreign", projectId: "another-project" },
      ],
    };
    mockContents([
      generated({ id: "duplicate" }),
      generated({ id: "foreign" }),
    ]);
    const result = (
      await generateStep(p, "contents", { ...defaultConfig, mock: false })
    ).contents!;
    expect(
      result.every((row) => row.id !== "duplicate" && row.id !== "foreign"),
    ).toBe(true);
    expect(
      result.every((row) => row.createdAt === "2026-10-18T12:00:00.000Z"),
    ).toBe(true);
  });

  it("keeps non-metadata fields strict and does not invent planned publication dates", () => {
    expect(() =>
      parseStepOutput(
        "contents",
        JSON.stringify({ contents: [generated({ body: undefined })] }),
      ),
    ).toThrow("contents.0.body");
    expect(() =>
      parseStepOutput(
        "contents",
        JSON.stringify({ contents: [generated({ id: 123 })] }),
      ),
    ).toThrow("contents.0.id");
    const result = validateStepOutput(
      "contents",
      { contents: [generated({ publishAt: "第 1 周 周三 18:00" })] },
      project(),
    );
    expect(result.contents?.[0].publishAt).toBe("第 1 周 周三 18:00");
  });
});
