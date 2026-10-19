import type { Project, UsageLog } from "./domain";
export type ExportFormat = "markdown" | "json" | "html";
export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
function valueText(value: unknown, level = 0): string {
  if (value === null || value === undefined) return "未生成";
  if (typeof value === "boolean") return value ? "是" : "否";
  if (Array.isArray(value))
    return value
      .map((v, i) =>
        typeof v === "object"
          ? `\n### ${i + 1}\n${valueText(v, level + 1)}`
          : `- ${valueText(v, level + 1)}`,
      )
      .join("\n");
  if (typeof value === "object")
    return Object.entries(value)
      .filter(([k]) => !["id", "projectId"].includes(k))
      .map(([k, v]) => `**${labels[k] || k}**\n${valueText(v, level + 1)}`)
      .join("\n\n");
  return String(value);
}
const labels: Record<string, string> = {
  name: "名称",
  brand: "品牌",
  product: "产品",
  industry: "行业",
  background: "项目背景",
  problem: "市场问题",
  sellingPoints: "产品卖点",
  competitors: "竞品情况",
  audience: "目标人群",
  needs: "用户需求",
  goals: "营销目标",
  platforms: "发布平台",
  budget: "预算（元）",
  duration: "周期（天）",
  tone: "品牌语气",
  requirements: "其他要求",
  persona: "用户画像",
  scenarios: "生活场景",
  painPoints: "用户痛点",
  motivations: "购买动机",
  mediaHabits: "内容习惯",
  perceptions: "产品认知",
  concerns: "用户疑虑",
  opportunity: "市场机会",
  challenge: "传播挑战",
  positioning: "核心定位",
  coreMessage: "传播主张",
  strategy: "传播策略",
  rhythm: "传播节奏",
  risks: "风险",
  explanation: "创意解释",
  format: "内容形式",
  example: "内容示例",
  expected: "预期效果（规划）",
  risk: "执行风险",
  title: "内容标题",
  body: "正文 / 脚本",
  platform: "平台",
  type: "类型",
  goal: "目标",
  publishAt: "建议发布时间",
  review: "审核状态",
  needsEdit: "需人工修改",
  owner: "负责人",
  createdAt: "创建时间",
  updatedAt: "更新时间",
  phase: "阶段",
  time: "时间",
  tasks: "内容任务",
  deliverables: "交付物",
  metrics: "数据指标",
  target: "目标值",
  formula: "计算方式",
  source: "数据来源",
  frequency: "复盘频率",
  current: "当前完成状态",
  severity: "风险等级",
  area: "审核项目",
  issue: "问题",
  suggestion: "处理建议",
  resolved: "已处理",
  role: "平台角色",
  quantity: "数量",
  objective: "内容目标",
  score: "方案完整性评分（非投放效果）",
  summary: "结论",
  checks: "检查项",
  passed: "通过",
  detail: "说明",
  landscape: "市场判断",
  limitations: "证据边界",
  evidence: "依据",
  message: "传播主张",
  action: "操作",
  model: "模型",
  result: "结果",
  actor: "操作人",
  success: "成功",
  projectName: "项目",
  isExample: "示例记录",
};
export function projectMarkdown(project: Project, logs: UsageLog[]): string {
  const sections: [string, unknown][] = [
    ["Brief", project.brief],
    ["用户洞察", project.solution.audience],
    ["市场分析", project.solution.market],
    ["核心策略", project.solution.strategy],
    ["创意方向", project.solution.creatives],
    ["内容矩阵", project.solution.matrix],
    ["平台内容", project.solution.contents],
    ["传播排期", project.solution.timeline],
    ["KPI", project.solution.kpis],
    ["风险审核", project.solution.compliance],
    ["方案质检", project.solution.quality],
    ["使用记录", logs.filter((l) => l.projectId === project.id)],
  ];
  return `# ${project.brief.name}\n\n> ${project.isExample ? "内置虚构示例，不代表真实客户项目或投放结果。" : "营销规划草案；目标值不代表实际效果，发布前需人工审核。"}\n\n状态：${project.status}\n模型：${project.model}\n创建时间：${project.createdAt}\n最近更新：${project.updatedAt}\n人工审核模块：${project.reviewedModules.join("、") || "尚未完成"}\n\n${sections.map(([name, v]) => `## ${name}\n\n${valueText(v)}`).join("\n\n")}`;
}
export function serializeProject(
  project: Project,
  logs: UsageLog[],
  format: ExportFormat,
): { text: string; mime: string; extension: string } {
  if (format === "json")
    return {
      text: JSON.stringify(
        {
          schemaVersion: 1,
          exportedAt: new Date().toISOString(),
          project,
          usageLogs: logs.filter((l) => l.projectId === project.id),
        },
        null,
        2,
      ),
      mime: "application/json",
      extension: "json",
    };
  const markdown = projectMarkdown(project, logs);
  if (format === "markdown")
    return {
      text: markdown,
      mime: "text/markdown;charset=utf-8",
      extension: "md",
    };
  const body = markdown
    .split("\n")
    .map((line) =>
      line.startsWith("# ")
        ? ""
        : line.startsWith("## ")
          ? `<h2>${escapeHtml(line.slice(3))}</h2>`
          : line.startsWith("### ")
            ? `<h3>${escapeHtml(line.slice(4))}</h3>`
            : /^\*\*.+\*\*$/.test(line)
              ? `<h4>${escapeHtml(line.slice(2, -2))}</h4>`
              : line.startsWith("> ")
                ? `<aside>${escapeHtml(line.slice(2))}</aside>`
                : line.startsWith("- ")
                  ? `<p class="item">${escapeHtml(line.slice(2))}</p>`
                  : line.trim()
                    ? `<p>${escapeHtml(line)}</p>`
                    : "",
    )
    .join("\n");
  return {
    text: `<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(project.brief.name)}</title><style>body{font:14px/1.9 system-ui,sans-serif;color:#35435a;max-width:900px;margin:48px auto;padding:0 28px;overflow-wrap:anywhere}h1{font-size:28px;color:#20334e}h2{font-size:21px;border-bottom:1px solid #dfe6f1;padding-bottom:14px;margin-top:42px;color:#245bca}h3{font-size:17px;margin-top:28px}h4{font-size:13px;color:#8795aa;margin:20px 0 5px;font-weight:500}p{margin:5px 0;white-space:pre-wrap}.item:before{content:'•';color:#8ea9de;margin-right:10px}aside{padding:15px;background:#f3f6fc;color:#7b8aa4;font-size:12px;margin:20px 0}header{border-bottom:2px solid #1f5eff;padding-bottom:20px}header p{font-size:11px;color:#91a0b8}@media print{body{margin:0}h2{break-after:avoid}}</style></head><body><header><p>BLUEMARK / MARKETING SOLUTION</p><h1>${escapeHtml(project.brief.name)}</h1><p>蓝标智策 · 营销方案</p></header>${body}</body></html>`,
    mime: "text/html;charset=utf-8",
    extension: "html",
  };
}
export function downloadFile(
  name: string,
  text: string,
  mime = "application/json",
) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name.replace(/[\\/:*?"<>|]/g, "_");
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function downloadProject(
  project: Project,
  logs: UsageLog[],
  format: ExportFormat,
) {
  const file = serializeProject(project, logs, format);
  downloadFile(`${project.brief.name}.${file.extension}`, file.text, file.mime);
}
