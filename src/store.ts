import { create } from "zustand";
import {
  defaultConfig,
  emptyBrief,
  newSteps,
  now,
  uid,
  STEP_KEYS,
  STEP_LABELS,
} from "./domain";
import type {
  Brief,
  ContentItem,
  ModelConfig,
  Project,
  Settings,
  StepKey,
  UsageLog,
} from "./domain";
import { seedProjects, seedLogs } from "./data";
import { generateStep, moduleSchemas } from "./engine";
import { persistedSchema } from "./persistence";

export const STORAGE_KEY = "bluemark.workspace.v1";
const initialSettings: Settings = {
  workspace: "BlueMark 创意工作空间",
  language: "简体中文",
  defaultModel: "deepseek-chat",
  exportFormat: "markdown",
  autoSave: true,
};
async function effectiveConfig(config: ModelConfig): Promise<ModelConfig> {
  if (config.mock) return { ...config };
  let status: { configured: boolean; model: string };
  try {
    const res = await fetch("/api/status", {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error();
    status = await res.json();
    if (
      typeof status.configured !== "boolean" ||
      typeof status.model !== "string"
    )
      throw new Error();
  } catch {
    throw new Error("无法连接本地模型代理，请检查服务或手动开启 Mock 模式。");
  }
  if (status.configured) return { ...config, model: status.model };
  if (config.apiKey.trim()) return { ...config };
  useApp.getState().updateConfig({ mock: true });
  useApp.getState().notify("未配置 API Key，本次已切换至 Mock 模式");
  return { ...config, mock: true };
}
interface Persisted {
  version: 1;
  projects: Project[];
  logs: UsageLog[];
  config: ModelConfig;
  settings: Settings;
  draft: Brief;
}
function initialData(): Persisted {
  const projects = seedProjects();
  return {
    version: 1,
    projects,
    logs: seedLogs(projects),
    config: { ...defaultConfig },
    settings: { ...initialSettings },
    draft: { ...emptyBrief },
  };
}
function readData(): { data: Persisted; error: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { data: initialData(), error: "" };
    const p = persistedSchema.parse(JSON.parse(raw)) as Persisted;
    if (
      p.version !== 1 ||
      !Array.isArray(p.projects) ||
      !Array.isArray(p.logs) ||
      !p.settings ||
      !p.config ||
      !p.draft ||
      p.projects.some(
        (x) => !x.id || !x.brief || !x.solution || !Array.isArray(x.steps),
      )
    )
      throw new Error("数据结构无效");
    p.config = { ...defaultConfig, ...p.config, apiKey: "" };
    p.settings = { ...initialSettings, ...p.settings };
    p.projects = p.projects.map((project) => ({
      ...project,
      status: project.status === "生成中" ? "草稿" : project.status,
      steps: project.steps.map((s) =>
        s.status === "running"
          ? { ...s, status: "error", error: "上次生成已中断，请重试。" }
          : s,
      ),
    }));
    if (!p.projects.some((project) => project.id === "case-dji-osmo-360-2026")) {
      const djiCase = seedProjects().find(
        (project) => project.id === "case-dji-osmo-360-2026",
      );
      if (djiCase) {
        p.projects = [...p.projects, djiCase];
        p.logs = [...p.logs, ...seedLogs([djiCase])];
      }
    }
    return { data: p, error: "" };
  } catch {
    return {
      data: initialData(),
      error:
        "本地数据读取失败，已加载示例。原始数据未覆盖，请先备份浏览器存储。",
    };
  }
}
export interface AppState extends Persisted {
  saveError: string;
  toast: string;
  storageBlocked: boolean;
  notify: (message: string) => void;
  clearToast: () => void;
  createProject: (brief: Brief) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  updateBrief: (id: string, brief: Brief) => void;
  duplicateProject: (id: string) => string;
  deleteProject: (id: string) => void;
  addLog: (
    projectId: string,
    action: string,
    result: string,
    success?: boolean,
  ) => void;
  saveDraft: (brief: Brief) => void;
  updateConfig: (patch: Partial<ModelConfig>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  updateContent: (
    projectId: string,
    contentId: string,
    patch: Partial<ContentItem>,
    expectedUpdatedAt?: string,
  ) => boolean;
  reviewModule: (projectId: string, module: string) => void;
  run: (projectId: string, only?: StepKey) => Promise<void>;
  regenerateContent: (projectId: string, contentId: string) => Promise<void>;
  reset: () => void;
}
const loaded = readData();
export const useApp = create<AppState>((set, get) => ({
  ...loaded.data,
  saveError: loaded.error,
  storageBlocked: !!loaded.error,
  toast: "",
  notify: (toast) => set({ toast }),
  clearToast: () => set({ toast: "" }),
  createProject: (brief) => {
    const id = uid("project"),
      time = now();
    const project: Project = {
      id,
      brief: structuredClone(brief),
      status: "草稿",
      createdAt: time,
      updatedAt: time,
      model: "尚未生成",
      isCase: false,
      favorite: false,
      isExample: false,
      reviewedModules: [],
      solution: {},
      steps: newSteps(),
    };
    set((s) => ({
      projects: [project, ...s.projects],
      draft: { ...emptyBrief },
    }));
    get().addLog(id, "创建项目", "项目已创建");
    return id;
  },
  updateProject: (id, patch) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: now() } : p,
      ),
    })),
  updateBrief: (id, brief) => {
    get().updateProject(id, {
      brief,
      reviewedModules: [],
      status: "草稿",
      steps: newSteps(),
    });
    get().addLog(
      id,
      "保存 Brief",
      "Brief 已更新，已有方案保留供参考，请重新生成以匹配新 Brief。",
    );
  },
  duplicateProject: (id) => {
    const source = get().projects.find((p) => p.id === id);
    if (!source) throw new Error("项目不存在");
    const newId = uid("project"),
      time = now();
    const copy: Project = {
      ...structuredClone(source),
      id: newId,
      brief: { ...source.brief, name: `${source.brief.name} · 副本` },
      createdAt: time,
      updatedAt: time,
      status: "草稿",
      isCase: false,
      favorite: false,
      isExample: false,
      sourceCaseId: source.id,
      reviewedModules: [],
      steps: newSteps(),
      solution: {
        ...structuredClone(source.solution),
        compliance: source.solution.compliance?.map((r) => ({
          ...r,
          resolved: false,
        })),
        contents: source.solution.contents?.map((c) => ({
          ...c,
          id: uid("content"),
          projectId: newId,
          review: "待审核",
          needsEdit: true,
          createdAt: time,
          updatedAt: time,
        })),
      },
    };
    set((s) => ({ projects: [copy, ...s.projects] }));
    get().addLog(
      newId,
      "复制项目",
      `来源：${source.brief.name}；保留内容，审核状态已重置。`,
    );
    return newId;
  },
  deleteProject: (id) => {
    const project = get().projects.find((p) => p.id === id);
    if (!project) return;
    if (project.steps.some((s) => s.status === "running")) {
      get().notify("项目生成中，请等待完成后删除。");
      return;
    }
    get().addLog(id, "删除项目", "项目已删除，操作记录保留");
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
  },
  addLog: (projectId, action, result, success = true) => {
    const s = get(),
      p = s.projects.find((p) => p.id === projectId);
    const log: UsageLog = {
      id: uid("log"),
      projectId,
      projectName: p?.brief.name || "BlueMark",
      time: now(),
      action,
      model: p?.model || "—",
      result,
      actor: "本地用户",
      success,
    };
    set((s) => ({ logs: [log, ...s.logs] }));
  },
  saveDraft: (draft) => set({ draft: structuredClone(draft) }),
  updateConfig: (patch) => set((s) => ({ config: { ...s.config, ...patch } })),
  updateSettings: (patch) =>
    set((s) => ({ settings: { ...s.settings, ...patch } })),
  updateContent: (projectId, contentId, patch, expectedUpdatedAt) => {
    const p = get().projects.find((p) => p.id === projectId);
    const current = p?.solution.contents?.find((c) => c.id === contentId);
    if (!p || !current) {
      get().notify("内容已不存在，请刷新后重试");
      return false;
    }
    if (
      expectedUpdatedAt !== undefined &&
      current.updatedAt !== expectedUpdatedAt
    ) {
      get().notify("内容已更新，请关闭编辑窗口并重新打开，避免覆盖新版本");
      return false;
    }
    if (expectedUpdatedAt !== undefined && p.status === "生成中") {
      get().notify("项目正在生成，请稍后保存");
      return false;
    }
    const merged = { ...current, ...patch, id: current.id, projectId };
    if (!moduleSchemas.contents.element.safeParse(merged).success) {
      get().notify("内容字段无效，标题、正文、平台、类型、目标和排期不得为空");
      return false;
    }
    const contentChanged = [
      "title",
      "body",
      "platform",
      "goal",
      "publishAt",
      "type",
    ].some(
      (key) =>
        key in patch &&
        patch[key as keyof ContentItem] !==
          p.solution.contents?.find((c) => c.id === contentId)?.[
            key as keyof ContentItem
          ],
    );
    const normalized = contentChanged
      ? { ...patch, review: "待审核" as const, needsEdit: true }
      : patch;
    get().updateProject(projectId, {
      status: "待审核",
      reviewedModules: p.reviewedModules.filter(
        (m) => m !== "contents" && (!contentChanged || m !== "compliance"),
      ),
      solution: {
        ...p.solution,
        compliance: contentChanged
          ? p.solution.compliance?.map((r) => ({ ...r, resolved: false }))
          : p.solution.compliance,
        contents: p.solution.contents?.map((c) =>
          c.id === contentId
            ? { ...c, ...normalized, id: c.id, projectId, updatedAt: now() }
            : c,
        ),
      },
    });
    get().addLog(
      projectId,
      normalized.review === "已审核" ? "完成人工审核" : "修改内容",
      `${p.solution.contents?.find((c) => c.id === contentId)?.title}：${normalized.review || "已保存"}`,
    );
    return true;
  },
  reviewModule: (projectId, module) => {
    const p = get().projects.find((p) => p.id === projectId);
    if (!p) return;
    get().updateProject(projectId, {
      reviewedModules: [...new Set([...p.reviewedModules, module])],
    });
    get().addLog(projectId, "完成人工审核", `${module} 模块已审核`);
  },
  run: async (projectId, only) => {
    const start = get().projects.find((p) => p.id === projectId);
    if (
      !start ||
      start.status === "生成中" ||
      start.steps.some((s) => s.status === "running")
    )
      return;
    const firstIncomplete = start.steps.findIndex(
      (s) => s.status !== "success",
    );
    const keys: readonly StepKey[] = only
      ? [only]
      : firstIncomplete > 0
        ? STEP_KEYS.slice(firstIncomplete)
        : STEP_KEYS;
    let config = { ...get().config };
    get().updateProject(projectId, {
      status: "生成中",
      reviewedModules: [],
      steps: start.steps.map((s) =>
        keys.includes(s.key)
          ? { ...s, status: "pending", error: undefined }
          : s,
      ),
    });
    try {
      config = await effectiveConfig(config);
      get().updateProject(projectId, {
        model: config.mock ? "Mock · 结构化示例" : config.model,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "模型配置读取失败";
      get().updateProject(projectId, {
        status: "草稿",
        steps: start.steps.map((s) =>
          s.key === keys[0] ? { ...s, status: "error", error: message } : s,
        ),
      });
      get().addLog(projectId, "模型连接", message, false);
      get().notify(message);
      return;
    }
    for (const key of keys) {
      let p = get().projects.find((p) => p.id === projectId);
      if (!p) return;
      get().updateProject(projectId, {
        steps: p.steps.map((s) =>
          s.key === key
            ? {
                ...s,
                status: "running",
                error: undefined,
                startedAt: now(),
                attempts: s.attempts + 1,
              }
            : s,
        ),
      });
      try {
        p = get().projects.find((p) => p.id === projectId)!;
        const output = await generateStep(p, key, config);
        const latest = get().projects.find((p) => p.id === projectId)!;
        get().updateProject(projectId, {
          solution: { ...latest.solution, ...output },
          steps: latest.steps.map((s) =>
            s.key === key ? { ...s, status: "success", finishedAt: now() } : s,
          ),
        });
        get().addLog(
          projectId,
          STEP_LABELS[key],
          config.mock
            ? "Mock 输出已保存；未经市场数据验证"
            : "模型输出已校验并保存",
        );
      } catch (error) {
        const latest = get().projects.find((p) => p.id === projectId);
        if (!latest) return;
        const message = error instanceof Error ? error.message : "生成失败";
        get().updateProject(projectId, {
          status: "草稿",
          steps: latest.steps.map((s) =>
            s.key === key
              ? { ...s, status: "error", error: message, finishedAt: now() }
              : s,
          ),
        });
        get().addLog(projectId, STEP_LABELS[key], message, false);
        get().notify(message);
        return;
      }
    }
    get().updateProject(projectId, { status: "待审核" });
    get().addLog(projectId, "保存方案", "输出已保存，等待人工审核");
    get().notify(
      only ? "模块已更新，审核状态已重置" : "方案已生成，请完成人工审核",
    );
  },
  regenerateContent: async (projectId, contentId) => {
    const p = get().projects.find((p) => p.id === projectId);
    if (
      !p ||
      p.status === "生成中" ||
      p.steps.some((s) => s.status === "running")
    )
      throw new Error("项目生成中，请稍后重试");
    const existing = p.solution.contents?.find((c) => c.id === contentId);
    if (!existing) return;
    get().updateProject(projectId, {
      status: "生成中",
      steps: p.steps.map((s) =>
        s.key === "contents" ? { ...s, status: "running" } : s,
      ),
    });
    get().addLog(projectId, "重新生成", `开始生成：${existing.title}`);
    try {
      const config = await effectiveConfig(get().config);
      get().updateProject(projectId, {
        model: config.mock ? "Mock · 结构化示例" : config.model,
      });
      const requestProject = {
        ...p,
        brief: {
          ...p.brief,
          platforms: [...new Set([...p.brief.platforms, existing.platform])],
          requirements: `${p.brief.requirements}\n本次重点改写内容：${existing.title}\n原文：${existing.body}\n保留 ${existing.platform} 渠道与原内容目标，尝试新的切入角度。`,
        },
      };
      const output = await generateStep(requestProject, "contents", config);
      const candidates =
        output.contents?.filter((c) => c.platform === existing.platform) || [];
      const siblings =
        p.solution.contents?.filter((c) => c.platform === existing.platform) ||
        [];
      const index = siblings.findIndex((c) => c.id === existing.id);
      const replacement = candidates[Math.max(0, index) % candidates.length];
      if (!replacement)
        throw new Error("模型未返回该平台内容，请检查 Brief 中的渠道");
      const latest = get().projects.find((project) => project.id === projectId);
      if (
        !latest ||
        latest.solution.contents?.find((c) => c.id === contentId)?.updatedAt !==
          existing.updatedAt
      )
        throw new Error("内容已发生变化，本次结果未覆盖现有内容，请重试。");
      get().updateContent(projectId, contentId, {
        ...replacement,
        id: existing.id,
        projectId,
        createdAt: existing.createdAt,
        review: "待审核",
        needsEdit: true,
      });
      get().addLog(
        projectId,
        "重新生成",
        `${existing.title} 已重新生成；${config.mock ? "Mock 模板重算（模板确定性输出）" : "模型输出"}`,
      );
      get().updateProject(projectId, { steps: p.steps });
    } catch (error) {
      get().addLog(
        projectId,
        "重新生成",
        error instanceof Error ? error.message : "生成失败",
        false,
      );
      set((state) => ({
        projects: state.projects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                status: p.status,
                steps: p.steps,
                model: p.model,
                updatedAt: p.updatedAt,
              }
            : project,
        ),
      }));
      throw error;
    }
  },
  reset: () => {
    set({ ...initialData(), saveError: "", storageBlocked: false });
    get().notify("本地数据已重置为内置示例");
  },
}));
let lastData = "";
useApp.subscribe((state) => {
  if (state.storageBlocked) return;
  const { projects, logs, config, settings, draft } = state;
  const text = JSON.stringify({
    version: 1,
    projects,
    logs,
    config: { ...config, apiKey: "" },
    settings,
    draft,
  });
  if (text === lastData) return;
  try {
    localStorage.setItem(STORAGE_KEY, text);
    lastData = text;
    if (state.saveError) useApp.setState({ saveError: "" });
  } catch {
    if (!state.saveError)
      useApp.setState({
        saveError: "本地保存失败，可能存储空间已满。请导出全部项目数据备份。",
      });
  }
});
