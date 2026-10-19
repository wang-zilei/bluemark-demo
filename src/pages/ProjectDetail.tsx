import { useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  Copy,
  Download,
  LoaderCircle,
  Pencil,
  Play,
  RefreshCw,
  Save,
  ShieldCheck,
  Star,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { useApp } from "../store";
import { briefSchema, validateStepOutput } from "../engine";
import { formatTime, STEP_LABELS } from "../domain";
import type { Brief, ContentItem, Project, Solution, StepKey } from "../domain";
import { downloadProject } from "../export";
import { SelectField } from "../components/SelectField";
import type { ExportFormat } from "../export";
import { Badge, Busy, copyText, Empty, Modal, Status } from "../components/ui";
import { PlatformLogo } from "../components/PlatformLogo";
const tabs = [
  { id: "overview", label: "概览" },
  { id: "audience", label: "用户洞察", step: "audience" },
  { id: "strategy", label: "营销策略", step: "strategy" },
  { id: "creatives", label: "创意方向", step: "creatives" },
  { id: "matrix", label: "内容矩阵", step: "matrix" },
  { id: "contents", label: "内容工厂", step: "contents" },
  { id: "timeline", label: "传播排期", step: "timeline" },
  { id: "kpis", label: "KPI", step: "kpis" },
  { id: "compliance", label: "风险审核", step: "compliance" },
  { id: "logs", label: "使用记录" },
];
const moduleNames: Record<string, string> = {
  persona: "用户画像",
  scenarios: "生活场景",
  painPoints: "用户痛点",
  motivations: "购买动机",
  mediaHabits: "内容消费习惯",
  perceptions: "产品认知",
  concerns: "可能的疑虑",
  opportunity: "市场机会",
  challenge: "传播挑战",
  positioning: "核心定位",
  coreMessage: "核心传播主张",
  tone: "品牌语气",
  strategy: "传播策略",
  rhythm: "传播节奏",
  risks: "风险与边界",
  name: "名称",
  explanation: "创意解释",
  platforms: "适用平台",
  format: "内容形式",
  audience: "目标用户",
  example: "内容示例",
  expected: "预期效果（规划）",
  risk: "执行风险",
  title: "内容标题",
  body: "正文 / 脚本",
  goal: "内容目标",
  publishAt: "建议发布时间",
  owner: "负责人",
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
  severity: "等级",
  area: "审核项目",
  issue: "问题",
  suggestion: "处理建议",
  resolved: "已处理",
  role: "平台角色",
  quantity: "内容数量",
  objective: "内容目标",
  landscape: "市场判断",
  competitors: "竞品与替代品",
  limitations: "证据边界",
  evidence: "判断依据",
  message: "传播主张",
  platform: "发布平台",
  type: "内容类型",
};
function DataView({ value }: { value: unknown }): ReactNode {
  if (value == null) return null;
  if (Array.isArray(value))
    return (
      <ul className="detail-list">
        {value.map((v, i) => (
          <li key={i}>
            {typeof v === "object" ? <DataView value={v} /> : String(v)}
          </li>
        ))}
      </ul>
    );
  if (typeof value === "object")
    return (
      <dl className="module-data">
        {Object.entries(value)
          .filter(
            ([k]) =>
              ![
                "id",
                "projectId",
                "createdAt",
                "updatedAt",
                "review",
                "needsEdit",
              ].includes(k) &&
              (value as Record<string, unknown>)[k] !== undefined,
          )
          .map(([key, v]) => (
            <div key={key}>
              <dt>{moduleNames[key] || key}</dt>
              <dd>
                {typeof v === "boolean" ? (
                  v ? (
                    "是"
                  ) : (
                    "否"
                  )
                ) : (
                  <DataView value={v} />
                )}
              </dd>
            </div>
          ))}
      </dl>
    );
  return <span className="preserve-text">{String(value)}</span>;
}
function StructuredEditor({
  value,
  onChange,
  label = "",
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  label?: string;
}): ReactNode {
  if (Array.isArray(value))
    return (
      <fieldset className="editor-group">
        <legend>{label}</legend>
        {value.map((v, i) => (
          <StructuredEditor
            key={i}
            label={`${i + 1}`}
            value={v}
            onChange={(next) =>
              onChange(value.map((old, index) => (index === i ? next : old)))
            }
          />
        ))}
      </fieldset>
    );
  if (value && typeof value === "object")
    return (
      <fieldset className="editor-group">
        <legend>{label}</legend>
        {Object.entries(value)
          .filter(
            ([k]) =>
              ![
                "id",
                "projectId",
                "createdAt",
                "updatedAt",
                "review",
                "needsEdit",
              ].includes(k),
          )
          .map(([key, v]) => (
            <StructuredEditor
              key={key}
              label={moduleNames[key] || key}
              value={v}
              onChange={(next) => onChange({ ...value, [key]: next })}
            />
          ))}
      </fieldset>
    );
  if (typeof value === "boolean")
    return (
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
    );
  if (typeof value === "number")
    return (
      <label className="field">
        <span>{label}</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
    );
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        rows={String(value).length > 100 ? 5 : 2}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
export function ContentDetailList({ project }: { project: Project }) {
  const [editing, setEditing] = useState<ContentItem | null>(null),
    [busy, setBusy] = useState("");
  const store = useApp();
  const contents = project.solution.contents || [];
  return (
    <>
      <div className="content-detail-list">
        {contents.map((c) => (
          <article className="content-record" key={c.id}>
            <div className="content-record-head">
              <PlatformLogo platform={c.platform} size="medium" />
              <span>{c.platform}</span>
              <Badge>{c.type}</Badge>
              <Status value={c.review} />
              <span className="push-right muted">{c.owner}</span>
            </div>
            <h3>{c.title}</h3>
            <p className="preserve-text">{c.body}</p>
            <div className="content-record-foot">
              <span>
                {c.goal} · {c.publishAt}
              </span>
              <div className="row-actions">
                <button
                  className="icon-button"
                  title="复制内容"
                  onClick={() => copyText(`${c.title}\n\n${c.body}`)}
                >
                  <Copy size={15} />
                </button>
                <button
                  className="icon-button"
                  title="编辑内容"
                  disabled={project.status === "生成中"}
                  onClick={() => setEditing({ ...c })}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button"
                  title="重新生成内容"
                  disabled={busy === c.id || project.status === "生成中"}
                  onClick={async () => {
                    setBusy(c.id);
                    try {
                      await store.regenerateContent(project.id, c.id);
                      store.notify("内容已重新生成");
                    } catch (e) {
                      store.notify(
                        e instanceof Error ? e.message : "重新生成失败",
                      );
                    } finally {
                      setBusy("");
                    }
                  }}
                >
                  {busy === c.id ? (
                    <LoaderCircle size={15} className="spin" />
                  ) : (
                    <RefreshCw size={15} />
                  )}
                </button>
                <button
                  className="button button-small button-secondary"
                  disabled={
                    c.review === "已审核" || project.status === "生成中"
                  }
                  onClick={() =>
                    store.updateContent(project.id, c.id, {
                      review: "已审核",
                      needsEdit: false,
                    })
                  }
                >
                  <Check size={14} />
                  标记已审核
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {editing && (
        <Modal title="编辑内容" onClose={() => setEditing(null)} wide>
          <label className="field">
            <span>标题</span>
            <input
              value={editing.title}
              onChange={(e) =>
                setEditing({ ...editing, title: e.target.value })
              }
            />
          </label>
          <label className="field">
            <span>正文 / 脚本</span>
            <textarea
              rows={15}
              value={editing.body}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
            />
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={editing.needsEdit}
              onChange={(e) =>
                setEditing({ ...editing, needsEdit: e.target.checked })
              }
            />
            需要人工修改
          </label>
          <div className="modal-actions">
            <button
              className="button button-secondary"
              onClick={() => setEditing(null)}
            >
              取消
            </button>
            <button
              className="button button-primary"
              disabled={project.status === "生成中"}
              onClick={() => {
                const saved = store.updateContent(
                  project.id,
                  editing.id,
                  {
                    ...editing,
                    review: "待审核",
                  },
                  editing.updatedAt,
                );
                if (!saved) return;
                setEditing(null);
                store.notify("内容已保存，待重新审核");
              }}
            >
              <Save size={15} />
              保存
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function ProjectDetail({ caseView = false }: { caseView?: boolean }) {
  const { id } = useParams(),
    store = useApp(),
    project = store.projects.find((p) => p.id === id);
  const [tab, setTab] = useState("overview"),
    [editor, setEditor] = useState<{
      key: string;
      value: unknown;
      revision: string;
    } | null>(null),
    [exporting, setExporting] = useState(false),
    [format, setFormat] = useState<ExportFormat>(store.settings.exportFormat);
  const navigate = useNavigate();
  if (!project)
    return (
      <Empty title="项目不存在或已删除">
        <Link to="/app/projects" className="button button-secondary">
          返回项目
        </Link>
      </Empty>
    );
  const p = project,
    done = p.steps.filter((s) => s.status === "success").length,
    running =
      p.status === "生成中" || p.steps.some((s) => s.status === "running"),
    logs = store.logs.filter((l) => l.projectId === p.id),
    active = tabs.find((t) => t.id === tab)!,
    value = p.solution[tab as keyof Solution];
  const reviewable = tabs.filter((t) => !!t.step),
    reviewed = reviewable.filter((t) =>
      p.reviewedModules.includes(t.id),
    ).length;
  const nextReview = reviewable.find((t) => !p.reviewedModules.includes(t.id));
  // 主操作跟随任务阶段：未生成完是“生成”，生成完待审是“标记可交付”
  const generated = done === p.steps.length,
    needsReview = generated && p.status !== "已完成";
  async function doExport() {
    setExporting(true);
    try {
      store.addLog(p.id, "导出方案", `请求导出 ${format.toUpperCase()} 文件`);
      downloadProject(p, useApp.getState().logs, format);
      store.notify("文件已提交浏览器下载");
    } catch (e) {
      store.addLog(p.id, "导出方案", "导出失败", false);
      store.notify(e instanceof Error ? e.message : "导出失败");
    } finally {
      setExporting(false);
    }
  }
  function deliver() {
    const unreviewed = reviewable.filter(
      (t) => !p.reviewedModules.includes(t.id),
    );
    if (unreviewed.length) {
      store.notify(`请先审核：${unreviewed.map((t) => t.label).join("、")}`);
      return;
    }
    if (p.solution.contents?.some((c) => c.review !== "已审核")) {
      store.notify("仍有未审核的平台内容");
      return;
    }
    if (
      p.solution.compliance?.some((r) => r.severity === "高" && !r.resolved)
    ) {
      store.notify("仍有未处理的高风险项");
      return;
    }
    if (done !== p.steps.length) {
      store.notify("请先完成全部生成步骤");
      return;
    }
    store.updateProject(p.id, { status: "已完成", isCase: true });
    store.addLog(p.id, "标记可交付", "人工审核完成，案例已保存");
    store.notify("已标记可交付并保存为案例");
  }
  return (
    <>
      <Link
        className="text-link detail-back"
        to={caseView ? "/app/cases" : "/app/projects"}
      >
        <ArrowLeft size={15} />
        {caseView ? "返回案例库" : "返回项目"}
      </Link>
      <div className="project-detail-heading">
        <div>
          <h1>{p.brief.name}</h1>
          <div className="detail-meta">
            <Badge>{p.brief.industry}</Badge>
            <Status value={p.status} />
            <span>{p.model}</span>
            <span>更新于 {formatTime(p.updatedAt)}</span>
            {p.sourceCaseId && <Badge>案例复用</Badge>}
          </div>
        </div>
        <div className="heading-actions">
          <button
            className="icon-button"
            title={p.favorite ? "取消收藏" : "收藏项目"}
            onClick={() => store.updateProject(p.id, { favorite: !p.favorite })}
          >
            <Star size={19} fill={p.favorite ? "currentColor" : "none"} />
          </button>
          {caseView ? (
            <button
              className="button button-primary"
              onClick={() => {
                const next = store.duplicateProject(p.id);
                navigate(`/app/projects/${next}`);
                store.notify("已复制为新项目");
              }}
            >
              <Copy size={16} />
              复制为新项目
            </button>
          ) : (
            <button
              className={`button ${generated ? "button-secondary" : "button-primary"}`}
              disabled={running}
              onClick={() => {
                if (
                  done === p.steps.length &&
                  !window.confirm(
                    "重新生成全部模块会替换现有方案，并重置人工审核。继续？",
                  )
                )
                  return;
                void store.run(p.id);
              }}
            >
              {running ? (
                <Busy label="生成中" />
              ) : (
                <>
                  <Play size={15} />
                  {generated ? "重新生成方案" : done ? "继续生成" : "生成方案"}
                </>
              )}
            </button>
          )}
          <SelectField
            ariaLabel="导出格式"
            value={format}
            onChange={(value) => setFormat(value as ExportFormat)}
            options={[
              { value: "markdown", label: "Markdown" },
              { value: "json", label: "JSON" },
              { value: "html", label: "HTML" },
            ]}
          />
          <button
            className="button button-secondary"
            onClick={doExport}
            disabled={exporting}
          >
            <Download size={16} />
            导出
          </button>
        </div>
      </div>
      {p.isExample && (
        <div className="sample-notice">
          <BookOpen size={16} />
          <span>
            内置虚构示例 · 非真实客户项目，预算与 KPI
            均为规划值。示例操作记录不代表本机真实执行。
          </span>
        </div>
      )}
      <div className="project-progress-strip">
        <div>
          <span className="progress-caption">方案生成</span>
          <strong>
            {done}
            <small> / {p.steps.length}</small>
          </strong>
          <div className="progress-track">
            <span style={{ width: `${(done / p.steps.length) * 100}%` }} />
          </div>
        </div>
        <div>
          <ShieldCheck size={17} />
          <span>人工审核</span>
          <strong>
            {reviewed} / {reviewable.length} 模块
          </strong>
        </div>
        <div className="progress-actions">
          <button
            className="button button-ghost button-small"
            disabled={running}
            onClick={() => {
              if (!p.solution.strategy) {
                store.notify("请先生成方案");
                return;
              }
              store.updateProject(p.id, { isCase: true });
              store.addLog(p.id, "保存案例", "已保存至案例库");
              store.notify("已保存至案例库");
            }}
          >
            <BookOpen size={15} />
            {p.isCase ? "已入案例库" : "保存为案例"}
          </button>
          <button
            className={`button ${needsReview ? "button-primary" : "button-secondary"} button-small`}
            disabled={running || p.status === "已完成"}
            onClick={() => (nextReview ? setTab(nextReview.id) : deliver())}
          >
            {p.status === "已完成" ? <Check size={15} /> : nextReview ? <Pencil size={15} /> : <CircleCheck size={15} />}
            {p.status === "已完成" ? "已交付" : nextReview ? "继续审核" : "标记可交付"}
          </button>
        </div>
      </div>
      <div className="detail-tabs" role="tablist" aria-label="方案模块">
        {tabs.map((t) => (
          <button
            role="tab"
            aria-selected={tab === t.id}
            key={t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {p.reviewedModules.includes(t.id) && <Check size={12} />}
          </button>
        ))}
      </div>
      {tab === "overview" ? (
        <div className="detail-overview">
          <div className="detail-overview-main">
            <section className="section">
              <div className="section-head">
                <h2>营销 Brief</h2>
                <button
                  className="button button-ghost button-small"
                  disabled={running}
                  onClick={() =>
                    setEditor({
                      key: "brief",
                      value: structuredClone(p.brief),
                      revision: p.updatedAt,
                    })
                  }
                >
                  <Pencil size={15} />
                  编辑
                </button>
              </div>
              <div className="brief-summary">
                <div className="brief-kv">
                  <span>品牌 / 产品</span>
                  <strong>
                    {p.brief.brand} · {p.brief.product}
                  </strong>
                </div>
                <div className="brief-kv">
                  <span>营销目标</span>
                  <strong>{p.brief.goals.join(" · ")}</strong>
                </div>
                <div className="brief-kv">
                  <span>周期 / 预算</span>
                  <strong>
                    {p.brief.duration} 天 / ¥{p.brief.budget.toLocaleString()}
                  </strong>
                </div>
                <div className="brief-kv">
                  <span>目标人群</span>
                  <p>{p.brief.audience}</p>
                </div>
                <div className="brief-kv">
                  <span>项目背景</span>
                  <p>{p.brief.background}</p>
                </div>
                <div className="brief-kv">
                  <span>市场问题</span>
                  <p>{p.brief.problem || "未提供"}</p>
                </div>
                <div className="brief-kv">
                  <span>产品卖点</span>
                  <p>{p.brief.sellingPoints}</p>
                </div>
                <div className="brief-kv">
                  <span>用户需求</span>
                  <p>{p.brief.needs || "未提供"}</p>
                </div>
                <div className="brief-kv">
                  <span>竞品情况</span>
                  <p>{p.brief.competitors || "未提供"}</p>
                </div>
                <div className="brief-kv">
                  <span>品牌语气</span>
                  <p>{p.brief.tone}</p>
                </div>
                <div className="brief-kv">
                  <span>渠道要求</span>
                  <p>
                    {p.brief.platforms.join(" · ")}
                    {p.brief.requirements && `；${p.brief.requirements}`}
                  </p>
                </div>
              </div>
            </section>
            {p.solution.strategy && (
              <section className="strategy-highlight">
                <h2>{p.solution.strategy.coreMessage}</h2>
                <p>{p.solution.strategy.positioning}</p>
                <button
                  className="text-link"
                  onClick={() => setTab("strategy")}
                >
                  查看营销策略 <ArrowRight size={15} />
                </button>
              </section>
            )}
            {p.solution.market && (
              <section className="section">
                <div className="section-head">
                  <h2>市场判断与证据边界</h2>
                </div>
                <div className="module-body">
                  <DataView value={p.solution.market} />
                  {p.solution.opportunity && (
                    <DataView value={p.solution.opportunity} />
                  )}{" "}
                  {p.solution.positioning && (
                    <DataView value={p.solution.positioning} />
                  )}
                </div>
              </section>
            )}
          </div>
          <aside className="workflow-panel">
            <div className="section-head">
              <h2>生成工作流</h2>
              <Badge tone="blue">{running ? "执行中" : "已保存"}</Badge>
            </div>
            <ol className="workflow-list">
              {p.steps.map((s, i) => (
                <li key={s.key} className={`workflow-${s.status}`}>
                  <span className="workflow-node">
                    {s.status === "success" ? (
                      <Check size={14} />
                    ) : s.status === "running" ? (
                      <LoaderCircle size={15} className="spin" />
                    ) : s.status === "error" ? (
                      <XCircle size={15} />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </span>
                  <div>
                    <strong>{STEP_LABELS[s.key]}</strong>
                    <small>
                      {s.status === "success"
                        ? `已保存 · ${formatTime(s.finishedAt || p.updatedAt)}`
                        : s.status === "running"
                          ? "正在生成"
                          : s.status === "error"
                            ? s.error
                            : "等待执行"}
                    </small>
                  </div>
                  {s.status === "error" && (
                    <button
                      className="icon-button"
                      title={`重试${STEP_LABELS[s.key]}`}
                      disabled={running}
                      onClick={() => void store.run(p.id, s.key)}
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}
                </li>
              ))}
            </ol>
            {p.solution.quality && (
              <div className="quality-summary">
                <ShieldCheck size={18} />
                <strong>
                  {p.solution.quality.score} <small>/ 100 完整性</small>
                </strong>
                <p>{p.solution.quality.summary}</p>
              </div>
            )}
          </aside>
        </div>
      ) : tab === "logs" ? (
        <section className="section">
          <div className="section-head">
            <h2>项目使用记录</h2>
            <span className="muted">{logs.length} 条记录</span>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作</th>
                  <th>操作人 / 模型</th>
                  <th>结果</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="nowrap">{formatTime(l.time)}</td>
                    <td>
                      {l.action} {l.isExample && <Badge>示例</Badge>}
                    </td>
                    <td>
                      {l.actor}
                      <span className="table-sub">{l.model}</span>
                    </td>
                    <td>
                      <span className={!l.success ? "danger-text" : ""}>
                        {l.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="section module-section">
          <div className="section-head">
            <h2>
              {active.label}{" "}
              {p.reviewedModules.includes(tab) && (
                <Badge tone="green">已审核</Badge>
              )}
            </h2>
            <div className="module-actions">
              <button
                className="icon-button"
                title="复制模块"
                disabled={!value}
                onClick={() => copyText(JSON.stringify(value, null, 2))}
              >
                <Copy size={16} />
              </button>
              <button
                className="button button-ghost button-small"
                disabled={!value || running}
                onClick={() =>
                  setEditor({
                    key: tab,
                    value: structuredClone(value),
                    revision: p.updatedAt,
                  })
                }
              >
                <Pencil size={15} />
                编辑
              </button>
              <button
                className="button button-secondary button-small"
                disabled={running}
                onClick={() => void store.run(p.id, active.step as StepKey)}
              >
                <RefreshCw size={15} />
                重新生成
              </button>
              <button
                className="button button-primary button-small"
                disabled={!value || running || p.reviewedModules.includes(tab)}
                onClick={() => {
                  if (
                    tab === "contents" &&
                    p.solution.contents?.some((c) => c.review !== "已审核")
                  ) {
                    store.notify("请逐条审核平台内容后，再确认模块审核");
                    return;
                  }
                  if (
                    tab === "compliance" &&
                    p.solution.compliance?.some(
                      (r) => r.severity === "高" && !r.resolved,
                    )
                  ) {
                    store.notify("请先处理高风险项");
                    return;
                  }
                  store.reviewModule(p.id, tab);
                  store.notify("模块已标记审核");
                }}
              >
                <Check size={15} />
                标记已审核
              </button>
            </div>
          </div>
          {!value ? (
            <Empty title="该模块尚未生成">
              <button
                className="button button-primary"
                disabled={running}
                onClick={() => void store.run(p.id, active.step as StepKey)}
              >
                <Play size={15} />
                生成{active.label}
              </button>
            </Empty>
          ) : tab === "contents" ? (
            <ContentDetailList project={p} />
          ) : tab === "kpis" ? (
            <>
              <div className="notice module-notice">
                以下为方案目标，不是已发生的投放数据。实际数据未接入，当前状态统一为未采集。
              </div>
              <div className="table-wrap">
                <table className="data-table kpi-table">
                  <thead>
                    <tr>
                      {[
                        "指标",
                        "规划目标",
                        "计算口径",
                        "数据来源",
                        "复盘频率",
                        "当前状态",
                      ].map((v) => (
                        <th key={v}>{v}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {p.solution.kpis?.map((k) => (
                      <tr key={k.name}>
                        <td>
                          <strong>{k.name}</strong>
                        </td>
                        <td className="kpi-target">{k.target}</td>
                        <td>{k.formula}</td>
                        <td>{k.source}</td>
                        <td>{k.frequency}</td>
                        <td>
                          <Badge>{k.current}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : tab === "matrix" ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {["平台", "平台角色", "内容形式", "数量", "内容目标"].map(
                      (v) => (
                        <th key={v}>{v}</th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {p.solution.matrix?.map((m) => (
                    <tr key={m.platform}>
                      <td>{m.platform}</td>
                      <td>{m.role}</td>
                      <td>{m.format}</td>
                      <td>{m.quantity}</td>
                      <td>{m.objective}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : tab === "timeline" ? (
            <div className="timeline-list">
              {p.solution.timeline?.map((t, i) => (
                <article key={t.phase}>
                  <div className="timeline-index">0{i + 1}</div>
                  <div>
                    <div className="timeline-title">
                      <h3>{t.phase}</h3>
                      <Badge tone="blue">{t.time}</Badge>
                    </div>
                    <DataView
                      value={{
                        goal: t.goal,
                        tasks: t.tasks,
                        platforms: t.platforms,
                        owner: t.owner,
                        deliverables: t.deliverables,
                        metrics: t.metrics,
                      }}
                    />
                  </div>
                </article>
              ))}
            </div>
          ) : tab === "creatives" ? (
            <div className="creative-list">
              {p.solution.creatives?.map((c, i) => (
                <article key={c.id}>
                  <div className="creative-title">
                    <span>CONCEPT 0{i + 1}</span>
                    <h3>{c.name}</h3>
                  </div>
                  <DataView value={{ ...c, name: undefined }} />
                </article>
              ))}
            </div>
          ) : tab === "compliance" ? (
            <div className="risk-list">
              {p.solution.compliance?.map((r, i) => (
                <article className="risk-item" key={`${r.area}-${i}`}>
                  <div>
                    <Badge
                      tone={
                        r.severity === "高"
                          ? "red"
                          : r.severity === "中"
                            ? "orange"
                            : "neutral"
                      }
                    >
                      {r.severity}风险
                    </Badge>
                    <h3>{r.area}</h3>
                    {r.resolved && <Badge tone="green">已处理</Badge>}
                  </div>
                  <p>{r.issue}</p>
                  <p className="muted">{r.suggestion}</p>
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={r.resolved}
                      onChange={(e) => {
                        store.updateProject(p.id, {
                          status: "待审核",
                          reviewedModules: p.reviewedModules.filter(
                            (m) => m !== "compliance",
                          ),
                          solution: {
                            ...p.solution,
                            compliance: p.solution.compliance?.map(
                              (old, index) =>
                                index === i
                                  ? { ...old, resolved: e.target.checked }
                                  : old,
                            ),
                          },
                        });
                        store.addLog(
                          p.id,
                          "风险处理",
                          `${r.area}：${e.target.checked ? "已处理" : "重新打开"}`,
                        );
                      }}
                    />
                    确认已处理
                  </label>
                </article>
              ))}
              {p.solution.quality && (
                <div className="quality-checks">
                  <h3>方案质检</h3>
                  {p.solution.quality.checks.map((q, i) => (
                    <div key={i}>
                      {q.passed ? (
                        <CircleCheck size={17} />
                      ) : (
                        <TriangleAlert size={17} />
                      )}
                      <strong>{q.name}</strong>
                      <span>{q.detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="module-body">
              <DataView value={value} />
            </div>
          )}
        </section>
      )}
      {editor && (
        <Modal
          title={
            editor.key === "brief"
              ? "编辑营销 Brief"
              : `编辑${tabs.find((t) => t.id === editor.key)?.label}`
          }
          onClose={() => setEditor(null)}
          wide
        >
          <div className="structured-editor">
            {editor.key === "brief" ? (
              Object.entries(editor.value as Brief).map(([key, v]) =>
                Array.isArray(v) ? (
                  <label className="field" key={key}>
                    <span>
                      {
                        (
                          {
                            goals: "营销目标",
                            platforms: "传播渠道",
                          } as Record<string, string>
                        )[key]
                      }
                    </span>
                    <input
                      value={v.join("、")}
                      onChange={(e) => {
                        const values = e.target.value
                          .split(/[、,，]/)
                          .map((s) => s.trim())
                          .filter(Boolean);
                        setEditor({
                          ...editor,
                          value: { ...(editor.value as Brief), [key]: values },
                        });
                      }}
                    />
                  </label>
                ) : (
                  <StructuredEditor
                    key={key}
                    label={
                      (
                        {
                          ...moduleNames,
                          name: "项目名称",
                          brand: "品牌名称",
                          product: "产品名称",
                          industry: "行业",
                          background: "项目背景",
                          problem: "市场问题",
                          sellingPoints: "产品卖点",
                          competitors: "竞品情况",
                          needs: "用户需求",
                          budget: "预算（元）",
                          duration: "周期（天）",
                          requirements: "其他要求",
                        } as Record<string, string>
                      )[key] || key
                    }
                    value={v}
                    onChange={(next) =>
                      setEditor({
                        ...editor,
                        value: { ...(editor.value as Brief), [key]: next },
                      })
                    }
                  />
                ),
              )
            ) : (
              <StructuredEditor
                value={editor.value}
                onChange={(value) => setEditor({ ...editor, value })}
              />
            )}
          </div>
          <div className="modal-actions">
            <button
              className="button button-secondary"
              onClick={() => setEditor(null)}
            >
              取消
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                const current = useApp
                  .getState()
                  .projects.find((project) => project.id === p.id);
                if (
                  !current ||
                  current.updatedAt !== editor.revision ||
                  current.status === "生成中"
                ) {
                  store.notify(
                    "项目已更新或正在生成，请关闭编辑窗口并重新打开",
                  );
                  return;
                }
                if (editor.key === "brief") {
                  const b = editor.value as Brief;
                  if (!briefSchema.safeParse(b).success) {
                    store.notify(
                      "请填写项目名称、品牌、产品、人群及有效预算和周期",
                    );
                    return;
                  }
                  store.updateBrief(p.id, b);
                } else {
                  try {
                    const checked = validateStepOutput(
                      editor.key as Exclude<StepKey, "validate">,
                      { [editor.key]: editor.value },
                    );
                    if (editor.key === "compliance")
                      editor.value = checked.compliance;
                  } catch (error) {
                    store.notify(
                      error instanceof Error ? error.message : "内容格式无效",
                    );
                    return;
                  }
                  store.updateProject(p.id, {
                    status: "待审核",
                    reviewedModules: p.reviewedModules.filter(
                      (m) => m !== editor.key,
                    ),
                    solution: {
                      ...p.solution,
                      [editor.key]:
                        editor.key === "contents"
                          ? (editor.value as ContentItem[]).map((c) => ({
                              ...c,
                              review: "待审核",
                            }))
                          : editor.value,
                    },
                  });
                  store.addLog(
                    p.id,
                    "修改方案",
                    `${active.label}已保存，审核状态重置`,
                  );
                }
                setEditor(null);
                store.notify("已保存");
              }}
            >
              <Save size={16} />
              保存
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
