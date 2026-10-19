// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emptyBrief, newSteps, STEP_KEYS } from "./domain";
import type { Brief, ContentItem, Project, Solution } from "./domain";

const { generateStep } = vi.hoisted(() => ({ generateStep: vi.fn() }));
vi.mock("./engine", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./engine")>()),
  generateStep,
}));

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      values.delete(key);
    }),
    clear: vi.fn(() => {
      values.clear();
    }),
  };
}

function brief(): Brief {
  return {
    ...structuredClone(emptyBrief),
    name: "测试新品项目",
    brand: "测试品牌",
    product: "植物茶饮",
    audience: "城市通勤人群",
  };
}

function content(projectId: string, id = "content-original"): ContentItem {
  return {
    id,
    projectId,
    title: "原始标题",
    body: "原始正文\n保留换行",
    platform: "小红书",
    type: "笔记",
    goal: "新品认知",
    publishAt: "2026-10-20T10:00:00+08:00",
    review: "已审核",
    needsEdit: false,
    owner: "待分配",
    createdAt: "2026-10-17T00:00:00.000Z",
    updatedAt: "2026-10-17T00:00:00.000Z",
  };
}

let storage: ReturnType<typeof memoryStorage>;
let useApp: typeof import("./store").useApp;
let storageKey: string;

async function refreshStore() {
  vi.resetModules();
  const module = await import("./store");
  useApp = module.useApp;
  storageKey = module.STORAGE_KEY;
}

function findProject(id: string): Project {
  const project = useApp.getState().projects.find((item) => item.id === id);
  expect(project, `project ${id} exists`).toBeDefined();
  return project!;
}

function createWithContent() {
  const id = useApp.getState().createProject(brief());
  useApp.getState().updateProject(id, {
    status: "已完成",
    reviewedModules: ["contents", "strategy"],
    solution: {
      contents: [content(id)],
      positioning: { positioning: "定位", message: "主张" },
    },
  });
  return id;
}

beforeEach(async () => {
  vi.resetAllMocks();
  storage = memoryStorage();
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("Store tests must not call the network");
    }),
  );
  await refreshStore();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("project lifecycle", () => {
  it("creates an independent draft with all pending steps, clears the form draft and logs the action", () => {
    const input = brief();
    useApp.getState().saveDraft(input);
    const previousCount = useApp.getState().projects.length;
    const id = useApp.getState().createProject(input);
    const project = findProject(id);

    expect(useApp.getState().projects).toHaveLength(previousCount + 1);
    expect(useApp.getState().projects[0].id).toBe(id);
    expect(project).toMatchObject({
      brief: input,
      status: "草稿",
      isCase: false,
      isExample: false,
      reviewedModules: [],
      solution: {},
    });
    expect(project.steps).toEqual(newSteps());
    expect(Number.isNaN(Date.parse(project.createdAt))).toBe(false);
    expect(useApp.getState().draft).toEqual(emptyBrief);
    input.brand = "外部修改";
    input.platforms.push("微博");
    expect(project.brief.brand).toBe("测试品牌");
    expect(project.brief.platforms).not.toContain("微博");
    expect(useApp.getState().logs[0]).toMatchObject({
      projectId: id,
      action: "创建项目",
      actor: "本地用户",
      success: true,
    });
    expect(useApp.getState().logs[0].isExample).not.toBe(true);
  });

  it("duplicates a case with new project/content IDs, retained content, source and reset reviews", () => {
    const sourceId = createWithContent();
    useApp.getState().updateProject(sourceId, {
      isCase: true,
      favorite: true,
      isExample: true,
      steps: newSteps().map((step) => ({
        ...step,
        status: "success",
        attempts: 2,
      })),
    });
    const source = structuredClone(findProject(sourceId));
    const copyId = useApp.getState().duplicateProject(sourceId);
    const copy = findProject(copyId);
    const copiedContent = copy.solution.contents![0];

    expect(copyId).not.toBe(sourceId);
    expect(copy).toMatchObject({
      sourceCaseId: sourceId,
      status: "草稿",
      isCase: false,
      favorite: false,
      isExample: false,
      reviewedModules: [],
    });
    expect(copy.brief.name).toContain("副本");
    expect(copy.steps).toEqual(newSteps());
    expect(copy.solution.positioning).toEqual(source.solution.positioning);
    expect(copiedContent).toMatchObject({
      projectId: copyId,
      title: source.solution.contents![0].title,
      body: source.solution.contents![0].body,
      review: "待审核",
    });
    expect(copiedContent.id).not.toBe(source.solution.contents![0].id);
    expect(findProject(sourceId)).toEqual(source);
    copy.solution.positioning!.message = "副本修改";
    expect(findProject(sourceId).solution.positioning!.message).toBe("主张");
    expect(useApp.getState().logs[0]).toMatchObject({
      projectId: copyId,
      action: "复制项目",
      success: true,
    });
    expect(useApp.getState().logs[0].isExample).not.toBe(true);
  });

  it("marks new actions on an example as real local actions, not seed history", () => {
    const example = useApp
      .getState()
      .projects.find((project) => project.isExample)!;
    expect(example).toBeDefined();
    useApp.getState().addLog(example.id, "修改内容", "本次实际操作");
    const log = useApp.getState().logs[0];
    expect(log).toMatchObject({
      projectId: example.id,
      actor: "本地用户",
      result: "本次实际操作",
      success: true,
    });
    expect(log.isExample).not.toBe(true);
  });

  it("does not inherit resolved compliance or approved content from the source case", () => {
    const sourceId = createWithContent();
    const solution = findProject(sourceId).solution;
    useApp.getState().updateProject(sourceId, {
      isCase: true,
      reviewedModules: ["contents", "compliance"],
      solution: {
        ...solution,
        compliance: [
          {
            severity: "高",
            area: "产品事实",
            issue: "卖点待核验",
            suggestion: "核验营养标签",
            resolved: true,
          },
          {
            severity: "中",
            area: "素材授权",
            issue: "图片待授权",
            suggestion: "确认授权范围",
            resolved: false,
          },
        ],
      },
    });
    const source = structuredClone(findProject(sourceId));
    const copyId = useApp.getState().duplicateProject(sourceId);
    const copy = findProject(copyId);
    expect(copy.solution.compliance).toEqual(
      source.solution.compliance!.map((risk) => ({ ...risk, resolved: false })),
    );
    expect(copy.solution.contents![0]).toMatchObject({
      review: "待审核",
      needsEdit: true,
    });
    expect(copy.reviewedModules).toEqual([]);
    expect(findProject(sourceId)).toEqual(source);
  });

  it("rejects empty or whitespace-only title/body patches without modifying saved content or logging success", () => {
    const id = createWithContent();
    const before = structuredClone(findProject(id));
    const logs = structuredClone(useApp.getState().logs);
    const persisted = storage.getItem(storageKey);
    for (const patch of [
      { title: "" },
      { title: " \t " },
      { body: "" },
      { body: " \n " },
    ]) {
      expect(
        useApp.getState().updateContent(id, "content-original", patch),
      ).toBe(false);
      expect(findProject(id)).toEqual(before);
      expect(useApp.getState().logs).toEqual(logs);
      expect(storage.getItem(storageKey)).toBe(persisted);
      expect(useApp.getState().toast).toContain("内容字段无效");
    }
  });

  it("accepts the current edit version but rejects a stale expectedUpdatedAt without overwriting the new version", () => {
    const id = createWithContent();
    const originalTimestamp = findProject(id).solution.contents![0].updatedAt;
    expect(
      useApp
        .getState()
        .updateContent(
          id,
          "content-original",
          { title: "先保存的版本" },
          originalTimestamp,
        ),
    ).toBe(true);
    const current = structuredClone(findProject(id));
    const logs = structuredClone(useApp.getState().logs);
    const persisted = storage.getItem(storageKey);
    expect(current.solution.contents![0].updatedAt).not.toBe(originalTimestamp);
    expect(
      useApp
        .getState()
        .updateContent(
          id,
          "content-original",
          { body: "过期窗口试图覆盖" },
          originalTimestamp,
        ),
    ).toBe(false);
    expect(findProject(id)).toEqual(current);
    expect(useApp.getState().logs).toEqual(logs);
    expect(storage.getItem(storageKey)).toBe(persisted);
    expect(useApp.getState().toast).toContain("内容已更新");
  });

  it("rejects a versioned edit while the project is generating even when its timestamp matches", () => {
    const id = createWithContent();
    useApp.getState().updateProject(id, { status: "生成中" });
    const before = structuredClone(findProject(id));
    const logs = structuredClone(useApp.getState().logs);
    const timestamp = before.solution.contents![0].updatedAt;
    expect(
      useApp
        .getState()
        .updateContent(
          id,
          "content-original",
          { body: "生成中提交的修改" },
          timestamp,
        ),
    ).toBe(false);
    expect(findProject(id)).toEqual(before);
    expect(useApp.getState().logs).toEqual(logs);
    expect(useApp.getState().toast).toContain("项目正在生成");
  });

  it("invalidates the content module and item review when approved text changes", () => {
    const id = createWithContent();
    useApp
      .getState()
      .updateContent(id, "content-original", { body: "修改后的正文" });
    const project = findProject(id);
    expect(project.status).toBe("待审核");
    expect(project.reviewedModules).toEqual(["strategy"]);
    expect(project.solution.contents![0]).toMatchObject({
      body: "修改后的正文",
      review: "待审核",
    });
    expect(useApp.getState().logs[0]).toMatchObject({
      projectId: id,
      action: "修改内容",
      success: true,
    });
  });

  it("allows an explicit review-only action without losing the content body", () => {
    const id = createWithContent();
    useApp
      .getState()
      .updateContent(id, "content-original", { review: "待审核" });
    useApp
      .getState()
      .updateContent(id, "content-original", {
        review: "已审核",
        needsEdit: false,
      });
    expect(findProject(id).solution.contents![0]).toMatchObject({
      review: "已审核",
      body: "原始正文\n保留换行",
    });
    expect(useApp.getState().logs[0].action).toBe("完成人工审核");
  });

  it("resets all module reviews and generation steps on a Brief edit while retaining old output", () => {
    const id = createWithContent();
    const oldSolution = structuredClone(findProject(id).solution);
    useApp.getState().updateBrief(id, { ...brief(), audience: "新的目标人群" });
    expect(findProject(id)).toMatchObject({
      status: "草稿",
      reviewedModules: [],
      solution: oldSolution,
      brief: { audience: "新的目标人群" },
    });
    expect(findProject(id).steps).toEqual(newSteps());
    expect(useApp.getState().logs[0].action).toBe("保存 Brief");
  });
});

describe("local persistence and recovery", () => {
  it("restores projects, logs, draft, settings and non-secret model configuration after refresh", async () => {
    const id = createWithContent();
    useApp.getState().saveDraft({ ...brief(), name: "未提交的草稿" });
    useApp
      .getState()
      .updateSettings({ workspace: "测试空间", exportFormat: "html" });
    useApp
      .getState()
      .updateConfig({
        model: "test-model",
        mock: false,
        apiKey: "SESSION_ONLY_SECRET",
      });
    useApp.getState().addLog(id, "保存 Brief", "用于刷新回归");
    const expectedProject = structuredClone(findProject(id));
    const expectedLogs = structuredClone(useApp.getState().logs);

    expect(useApp.getState().config.apiKey).toBe("SESSION_ONLY_SECRET");
    expect(storage.setItem).toHaveBeenCalled();
    for (const [, value] of storage.setItem.mock.calls) {
      expect(value).not.toContain("SESSION_ONLY_SECRET");
      expect(JSON.parse(value).config.apiKey).toBe("");
    }
    await refreshStore();
    expect(findProject(id)).toEqual(expectedProject);
    expect(useApp.getState().logs).toEqual(expectedLogs);
    expect(useApp.getState().draft.name).toBe("未提交的草稿");
    expect(useApp.getState().settings).toMatchObject({
      workspace: "测试空间",
      exportFormat: "html",
    });
    expect(useApp.getState().config).toMatchObject({
      model: "test-model",
      mock: false,
      apiKey: "",
    });
  });

  it("discards a legacy stored API key and never writes it back on a later save", async () => {
    useApp.getState().createProject(brief());
    const legacy = JSON.parse(storage.getItem(storageKey)!);
    legacy.config.apiKey = "LEGACY_SECRET";
    storage.setItem(storageKey, JSON.stringify(legacy));
    storage.setItem.mockClear();
    await refreshStore();
    expect(useApp.getState().config.apiKey).toBe("");
    useApp.getState().updateSettings({ workspace: "安全刷新" });
    for (const [, value] of storage.setItem.mock.calls)
      expect(value).not.toContain("LEGACY_SECRET");
  });

  it("recovers interrupted generation as a retryable error without erasing completed work", async () => {
    const id = createWithContent();
    const steps = newSteps();
    steps[0] = { ...steps[0], status: "success", attempts: 1 };
    steps[1] = {
      ...steps[1],
      status: "running",
      attempts: 1,
      startedAt: "2026-10-17T00:00:00.000Z",
    };
    useApp.getState().updateProject(id, { status: "生成中", steps });
    const oldSolution = structuredClone(findProject(id).solution);
    await refreshStore();
    const recovered = findProject(id);
    expect(recovered.status).toBe("草稿");
    expect(recovered.steps[0]).toMatchObject({
      status: "success",
      attempts: 1,
    });
    expect(recovered.steps[1]).toMatchObject({
      status: "error",
      attempts: 1,
      error: expect.stringContaining("中断"),
    });
    expect(recovered.steps[2].status).toBe("pending");
    expect(recovered.solution).toEqual(oldSolution);
  });

  it("does not overwrite corrupt local data with fresh examples until explicitly reset", async () => {
    storage.setItem(storageKey, "{invalid-json");
    storage.setItem.mockClear();
    await refreshStore();
    expect(useApp.getState()).toMatchObject({
      storageBlocked: true,
      saveError: expect.stringContaining("读取失败"),
    });
    useApp.getState().createProject(brief());
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.getItem(storageKey)).toBe("{invalid-json");
    useApp.getState().reset();
    expect(useApp.getState().storageBlocked).toBe(false);
    expect(JSON.parse(storage.getItem(storageKey)!).version).toBe(1);
  });

  it("blocks valid JSON with a missing nested project field without overwriting the original snapshot", async () => {
    useApp.getState().createProject(brief());
    const invalid = JSON.parse(storage.getItem(storageKey)!);
    delete invalid.projects[0].reviewedModules;
    const original = JSON.stringify(invalid);
    storage.setItem(storageKey, original);
    storage.setItem.mockClear();
    await refreshStore();
    expect(useApp.getState()).toMatchObject({
      storageBlocked: true,
      saveError: expect.stringContaining("读取失败"),
    });
    useApp.getState().updateSettings({ workspace: "不能覆盖损坏快照" });
    expect(storage.setItem).not.toHaveBeenCalled();
    expect(storage.getItem(storageKey)).toBe(original);
  });

  it("reports a storage failure while keeping the current project available in memory", () => {
    storage.setItem.mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    const id = useApp.getState().createProject(brief());
    expect(findProject(id).brief.name).toBe("测试新品项目");
    expect(useApp.getState().saveError).toContain("本地保存失败");
  });
});

describe("generation orchestration with an isolated engine mock", () => {
  it("updates only the selected module and waits for output before recording success", async () => {
    const id = createWithContent();
    const output: Partial<Solution> = {
      positioning: { positioning: "新的定位", message: "新的主张" },
    };
    let finish!: (value: Partial<Solution>) => void;
    generateStep.mockImplementationOnce(
      () =>
        new Promise<Partial<Solution>>((resolve) => {
          finish = resolve;
        }),
    );
    const pending = useApp.getState().run(id, "positioning");
    expect(findProject(id).status).toBe("生成中");
    await vi.waitFor(() => expect(generateStep).toHaveBeenCalledTimes(1));
    expect(
      findProject(id).steps.find((step) => step.key === "positioning"),
    ).toMatchObject({ status: "running", attempts: 1 });
    expect(
      useApp
        .getState()
        .logs.some((log) => log.projectId === id && log.action === "保存方案"),
    ).toBe(false);
    finish(output);
    await pending;
    expect(findProject(id)).toMatchObject({
      status: "待审核",
      reviewedModules: [],
      solution: output,
    });
    expect(findProject(id).solution.contents![0].body).toBe(
      "原始正文\n保留换行",
    );
    expect(
      findProject(id).steps.find((step) => step.key === "positioning")?.status,
    ).toBe("success");
    expect(generateStep).toHaveBeenCalledTimes(1);
    expect(useApp.getState().logs[0]).toMatchObject({
      action: "保存方案",
      success: true,
    });
  });

  it("stops the full workflow on failure, preserves prior output and never claims success or uses Mock fallback", async () => {
    const id = createWithContent();
    const previousSolution = structuredClone(findProject(id).solution);
    useApp.getState().updateConfig({ mock: false, model: "compatible-test" });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ configured: true, model: "compatible-test" }),
          ),
        ),
    );
    generateStep
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error("模型鉴权失败"));
    await useApp.getState().run(id);
    const project = findProject(id);
    expect(generateStep.mock.calls.map((call) => call[1])).toEqual([
      "validate",
      "audience",
    ]);
    expect(
      generateStep.mock.calls.every((call) => call[2].mock === false),
    ).toBe(true);
    expect(project).toMatchObject({
      status: "草稿",
      model: "compatible-test",
      solution: previousSolution,
    });
    expect(project.steps[0].status).toBe("success");
    expect(project.steps[1]).toMatchObject({
      status: "error",
      error: "模型鉴权失败",
      attempts: 1,
    });
    expect(
      project.steps.slice(2).every((step) => step.status === "pending"),
    ).toBe(true);
    const logs = useApp.getState().logs.filter((log) => log.projectId === id);
    expect(logs[0]).toMatchObject({
      action: "用户洞察",
      result: "模型鉴权失败",
      success: false,
    });
    expect(logs.some((log) => log.action === "保存方案")).toBe(false);
    expect(useApp.getState().toast).toBe("模型鉴权失败");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      "/api/status",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("explicitly switches to Mock only when preflight confirms there is no server or session key", async () => {
    const id = useApp.getState().createProject(brief());
    useApp.getState().updateConfig({ mock: false, apiKey: "" });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ configured: false, model: "server-default" }),
          ),
        ),
    );
    generateStep.mockResolvedValue({});
    const notices: string[] = [];
    const unsubscribe = useApp.subscribe((state) => {
      if (state.toast) notices.push(state.toast);
    });
    try {
      await useApp.getState().run(id, "positioning");
    } finally {
      unsubscribe();
    }
    expect(useApp.getState().config.mock).toBe(true);
    expect(notices).toContain("未配置 API Key，本次已切换至 Mock 模式");
    expect(generateStep).toHaveBeenCalledWith(
      expect.anything(),
      "positioning",
      expect.objectContaining({ mock: true, apiKey: "" }),
    );
    expect(findProject(id)).toMatchObject({
      status: "待审核",
      model: "Mock · 结构化示例",
    });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("uses the server model when configured and preserves the session key when only it is available", async () => {
    const id = useApp.getState().createProject(brief());
    useApp
      .getState()
      .updateConfig({
        mock: false,
        model: "ui-model",
        apiKey: "SESSION_SECRET",
      });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ configured: true, model: "server-model" }),
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ configured: false, model: "server-default" }),
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    generateStep.mockResolvedValue({});
    await useApp.getState().run(id, "positioning");
    expect(findProject(id).model).toBe("server-model");
    expect(generateStep.mock.calls[0][2]).toMatchObject({
      mock: false,
      model: "server-model",
    });
    await useApp.getState().run(id, "positioning");
    expect(findProject(id).model).toBe("ui-model");
    expect(generateStep.mock.calls[1][2]).toMatchObject({
      mock: false,
      model: "ui-model",
      apiKey: "SESSION_SECRET",
    });
    expect(useApp.getState().config.mock).toBe(false);
    for (const [, value] of storage.setItem.mock.calls)
      expect(value).not.toContain("SESSION_SECRET");
  });

  it.each(["network", "http", "shape"] as const)(
    "does not fall back or log success on %s preflight failure",
    async (failure) => {
      const id = createWithContent();
      const oldSolution = structuredClone(findProject(id).solution);
      useApp.getState().updateConfig({ mock: false, apiKey: "" });
      const fetchMock = vi.fn();
      if (failure === "network")
        fetchMock.mockRejectedValue(new TypeError("Network unavailable"));
      else if (failure === "http")
        fetchMock.mockResolvedValue(new Response("{}", { status: 503 }));
      else
        fetchMock.mockResolvedValue(
          new Response(JSON.stringify({ configured: "yes" })),
        );
      vi.stubGlobal("fetch", fetchMock);
      await useApp.getState().run(id, "positioning");
      expect(generateStep).not.toHaveBeenCalled();
      expect(useApp.getState().config.mock).toBe(false);
      expect(findProject(id)).toMatchObject({
        status: "草稿",
        solution: oldSolution,
      });
      expect(
        findProject(id).steps.find((step) => step.key === "positioning"),
      ).toMatchObject({
        status: "error",
        error: expect.stringContaining("代理"),
      });
      expect(useApp.getState().logs[0]).toMatchObject({
        projectId: id,
        action: "模型连接",
        success: false,
      });
      expect(
        useApp
          .getState()
          .logs.some(
            (log) => log.projectId === id && log.action === "保存方案",
          ),
      ).toBe(false);
    },
  );

  it("guards against duplicate starts while preflight is pending, even before any step is running", async () => {
    const id = useApp.getState().createProject(brief());
    useApp.getState().updateConfig({ mock: false, apiKey: "SESSION_SECRET" });
    let finish!: (value: Response) => void;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            finish = resolve;
          }),
      ),
    );
    generateStep.mockResolvedValue({});
    const pending = useApp.getState().run(id, "positioning");
    expect(findProject(id).status).toBe("生成中");
    expect(
      findProject(id).steps.every((step) => step.status === "pending"),
    ).toBe(true);
    await useApp.getState().run(id, "positioning");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(generateStep).not.toHaveBeenCalled();
    finish(
      new Response(JSON.stringify({ configured: true, model: "server-model" })),
    );
    await pending;
    expect(generateStep).toHaveBeenCalledTimes(1);
  });

  it("resumes at the first incomplete step without resetting earlier successful runs", async () => {
    const id = useApp.getState().createProject(brief());
    const steps = newSteps();
    steps[0] = {
      ...steps[0],
      status: "success",
      attempts: 3,
      finishedAt: "2026-10-17T00:00:00.000Z",
    };
    steps[1] = {
      ...steps[1],
      status: "success",
      attempts: 2,
      finishedAt: "2026-10-17T00:01:00.000Z",
    };
    steps[2] = { ...steps[2], status: "error", attempts: 1, error: "先前失败" };
    useApp.getState().updateProject(id, { steps });
    generateStep.mockResolvedValue({});
    await useApp.getState().run(id);
    expect(generateStep.mock.calls.map((call) => call[1])).toEqual(
      STEP_KEYS.slice(2),
    );
    expect(findProject(id).steps.slice(0, 2)).toEqual(steps.slice(0, 2));
    expect(findProject(id).steps[2]).toMatchObject({
      status: "success",
      attempts: 2,
    });
    expect(findProject(id).status).toBe("待审核");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("retries a failed module and increments attempts without replaying other steps", async () => {
    const id = useApp.getState().createProject(brief());
    generateStep
      .mockRejectedValueOnce(new Error("超时"))
      .mockResolvedValueOnce({
        positioning: { positioning: "定位", message: "主张" },
      });
    await useApp.getState().run(id, "positioning");
    expect(
      findProject(id).steps.find((step) => step.key === "positioning")?.status,
    ).toBe("error");
    await useApp.getState().run(id, "positioning");
    expect(
      findProject(id).steps.find((step) => step.key === "positioning"),
    ).toMatchObject({ status: "success", attempts: 2 });
    expect(
      findProject(id).steps.filter((step) => step.status === "pending"),
    ).toHaveLength(STEP_KEYS.length - 1);
  });

  it("locks regeneration, blocks overlapping runs and saves the actual server model with re-review required", async () => {
    const id = createWithContent();
    const before = structuredClone(findProject(id));
    useApp
      .getState()
      .updateConfig({ mock: false, model: "ui-model", apiKey: "" });
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            JSON.stringify({ configured: true, model: "actual-server-model" }),
          ),
        ),
    );
    let finish!: (value: Partial<Solution>) => void;
    generateStep.mockImplementationOnce(
      () =>
        new Promise<Partial<Solution>>((resolve) => {
          finish = resolve;
        }),
    );
    const pending = useApp.getState().regenerateContent(id, "content-original");
    expect(findProject(id).status).toBe("生成中");
    expect(
      findProject(id).steps.find((step) => step.key === "contents")?.status,
    ).toBe("running");
    await vi.waitFor(() => expect(generateStep).toHaveBeenCalledTimes(1));
    expect(findProject(id).model).toBe("actual-server-model");
    expect(generateStep.mock.calls[0][2]).toMatchObject({
      mock: false,
      model: "actual-server-model",
    });
    await useApp.getState().run(id, "contents");
    await expect(
      useApp.getState().regenerateContent(id, "content-original"),
    ).rejects.toThrow("生成中");
    expect(generateStep).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    finish({
      contents: [
        {
          ...content(id, "model-generated-id"),
          body: "重新生成的正文",
          review: "已审核",
          needsEdit: false,
        },
      ],
    });
    await pending;
    const updated = findProject(id);
    expect(updated).toMatchObject({
      status: "待审核",
      model: "actual-server-model",
      reviewedModules: ["strategy"],
    });
    expect(updated.steps).toEqual(before.steps);
    expect(updated.solution.contents![0]).toMatchObject({
      id: "content-original",
      projectId: id,
      body: "重新生成的正文",
      review: "待审核",
      needsEdit: true,
      createdAt: before.solution.contents![0].createdAt,
    });
    expect(useApp.getState().logs[0]).toMatchObject({
      projectId: id,
      action: "重新生成",
      model: "actual-server-model",
      success: true,
    });
  });

  it("restores the locked project and records a failure when item regeneration fails", async () => {
    const id = createWithContent();
    const before = structuredClone(findProject(id));
    let fail!: (reason: Error) => void;
    generateStep.mockImplementationOnce(
      () =>
        new Promise<Partial<Solution>>((_resolve, reject) => {
          fail = reject;
        }),
    );
    const pending = useApp.getState().regenerateContent(id, "content-original");
    const assertion = expect(pending).rejects.toThrow("模型输出字段缺失");
    expect(findProject(id).status).toBe("生成中");
    expect(
      findProject(id).steps.find((step) => step.key === "contents")?.status,
    ).toBe("running");
    await vi.waitFor(() => expect(generateStep).toHaveBeenCalledTimes(1));
    fail(new Error("模型输出字段缺失"));
    await assertion;
    expect(findProject(id)).toEqual(before);
    expect(useApp.getState().logs[0]).toMatchObject({
      projectId: id,
      action: "重新生成",
      result: "模型输出字段缺失",
      success: false,
    });
    expect(
      useApp
        .getState()
        .logs.some(
          (log) => log.projectId === id && log.result.includes("已重新生成"),
        ),
    ).toBe(false);
  });
});
