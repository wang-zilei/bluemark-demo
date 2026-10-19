export type ProjectStatus = "草稿" | "生成中" | "待审核" | "已完成" | "已归档";
export type ReviewStatus = "待审核" | "已审核" | "需要修改";
export type Platform = "小红书" | "抖音" | "微信公众号" | "视频号" | "微博";
export const PLATFORMS: Platform[] = [
  "小红书",
  "抖音",
  "微信公众号",
  "视频号",
  "微博",
];
export const INDUSTRIES = [
  "食品饮料 / 新消费",
  "美妆个护",
  "数码科技",
  "服饰生活",
  "文化旅游",
  "企业服务",
  "其他",
];
export interface Brief {
  name: string;
  brand: string;
  product: string;
  industry: string;
  background: string;
  problem: string;
  sellingPoints: string;
  competitors: string;
  audience: string;
  needs: string;
  goals: string[];
  platforms: Platform[];
  budget: number;
  duration: number;
  tone: string;
  requirements: string;
}
export interface Audience {
  persona: string;
  scenarios: string[];
  painPoints: string[];
  motivations: string[];
  mediaHabits: string[];
  perceptions: string[];
  concerns: string[];
}
export interface Strategy {
  opportunity: string;
  challenge: string;
  positioning: string;
  coreMessage: string;
  tone: string;
  strategy: string[];
  rhythm: string[];
  risks: string[];
}
export interface Creative {
  id: string;
  name: string;
  explanation: string;
  platforms: string[];
  format: string;
  audience: string;
  example: string;
  expected: string;
  risk: string;
}
export interface ContentItem {
  id: string;
  projectId: string;
  title: string;
  body: string;
  platform: Platform;
  type: string;
  goal: string;
  publishAt: string;
  review: ReviewStatus;
  needsEdit: boolean;
  owner: string;
  createdAt: string;
  updatedAt: string;
}
export interface TimelineItem {
  phase: string;
  time: string;
  goal: string;
  tasks: string[];
  platforms: string[];
  owner: string;
  deliverables: string;
  metrics: string;
}
export interface Kpi {
  name: string;
  target: string;
  formula: string;
  source: string;
  frequency: string;
  current: string;
}
export interface RiskItem {
  severity: "高" | "中" | "低";
  area: string;
  issue: string;
  suggestion: string;
  resolved: boolean;
}
export interface MatrixItem {
  platform: string;
  role: string;
  format: string;
  quantity: number;
  objective: string;
}
export interface Solution {
  audience?: Audience;
  market?: { landscape: string; competitors: string[]; limitations: string[] };
  opportunity?: { opportunity: string; evidence: string[] };
  positioning?: { positioning: string; message: string };
  strategy?: Strategy;
  creatives?: Creative[];
  matrix?: MatrixItem[];
  contents?: ContentItem[];
  timeline?: TimelineItem[];
  kpis?: Kpi[];
  compliance?: RiskItem[];
  quality?: {
    score: number;
    summary: string;
    checks: { name: string; passed: boolean; detail: string }[];
  };
}
export const STEP_KEYS = [
  "validate",
  "audience",
  "market",
  "opportunity",
  "positioning",
  "strategy",
  "creatives",
  "matrix",
  "contents",
  "timeline",
  "kpis",
  "compliance",
  "quality",
] as const;
export type StepKey = (typeof STEP_KEYS)[number];
export const STEP_LABELS: Record<StepKey, string> = {
  validate: "校验 Brief",
  audience: "用户洞察",
  market: "市场分析",
  opportunity: "机会识别",
  positioning: "品牌定位",
  strategy: "营销策略",
  creatives: "创意方向",
  matrix: "内容矩阵",
  contents: "平台内容",
  timeline: "传播排期",
  kpis: "KPI 规划",
  compliance: "合规检查",
  quality: "方案质检",
};
export interface StepRun {
  key: StepKey;
  status: "pending" | "running" | "success" | "error";
  error?: string;
  startedAt?: string;
  finishedAt?: string;
  attempts: number;
}
export interface Project {
  id: string;
  brief: Brief;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  model: string;
  isCase: boolean;
  favorite: boolean;
  isExample: boolean;
  sourceCaseId?: string;
  reviewedModules: string[];
  solution: Solution;
  steps: StepRun[];
}
export interface UsageLog {
  id: string;
  projectId: string;
  projectName: string;
  time: string;
  action: string;
  model: string;
  result: string;
  actor: string;
  success: boolean;
  isExample?: boolean;
}
export interface ModelConfig {
  provider: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  mock: boolean;
  connection: "untested" | "success" | "error";
  lastTestAt: string;
  error: string;
}
export interface Settings {
  workspace: string;
  language: string;
  defaultModel: string;
  exportFormat: "markdown" | "json" | "html";
  autoSave: boolean;
}
export const defaultConfig: ModelConfig = {
  provider: "OpenAI Compatible",
  baseUrl: "https://api.deepseek.com/v1",
  apiKey: "",
  model: "deepseek-chat",
  temperature: 0.7,
  maxTokens: 6000,
  timeout: 90,
  mock: true,
  connection: "untested",
  lastTestAt: "",
  error: "",
};
export const emptyBrief: Brief = {
  name: "",
  brand: "",
  product: "",
  industry: INDUSTRIES[0],
  background: "",
  problem: "",
  sellingPoints: "",
  competitors: "",
  audience: "",
  needs: "",
  goals: ["新品上市"],
  platforms: ["小红书", "抖音"],
  budget: 300000,
  duration: 30,
  tone: "自然、轻松、不过度营销",
  requirements: "",
};
export function uid(prefix = "id") {
  return `${prefix}-${crypto.randomUUID()}`;
}
export function now() {
  return new Date().toISOString();
}
export function formatTime(value: string) {
  return value
    ? new Date(value).toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    : "尚未保存";
}
export function newSteps(): StepRun[] {
  return STEP_KEYS.map((key) => ({ key, status: "pending", attempts: 0 }));
}
