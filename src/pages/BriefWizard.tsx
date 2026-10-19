import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Database,
  Download,
  ExternalLink,
  FileInput,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  Hammer,
  LoaderCircle,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Play,
  Plug,
  RotateCcw,
  Save,
  ScanSearch,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  WandSparkles,
  Workflow,
  X,
} from "lucide-react";
import { emptyBrief, INDUSTRIES, PLATFORMS } from "../domain";
import type { Brief, Platform } from "../domain";
import { exampleBrief } from "../data";
import {
  buildDeckSpec,
  downloadBriefMarkdown,
  downloadContentMatrix,
  downloadMarketingDeck,
} from "../agent-output";
import { useApp } from "../store";
import { PageHeader } from "../components/ui";
import { PlatformLogo } from "../components/PlatformLogo";
import { SelectField } from "../components/SelectField";
import "./brief-agent.css";

const steps = [
  ["项目定义", "明确任务边界"],
  ["品牌与产品", "建立事实底稿"],
  ["人群与场景", "还原选择情境"],
  ["目标与策略", "确定决策目标"],
  ["渠道与资源", "匹配渠道预算"],
  ["产出交付物", "生成可下载文件"],
];
const goalOptions = ["新品上市", "社交媒体种草", "首月转化", "品牌认知", "线索获取", "活动推广", "用户增长"];

type Message = {
  id: number;
  role: "agent" | "user";
  text: string;
  time: string;
  tags?: string[];
  artifactIds?: string[];
  toolRunId?: string;
};
type ArtifactKind = "deck" | "brief" | "matrix" | "compliance";
type Artifact = {
  id: string;
  kind: ArtifactKind;
  name: string;
  detail: string;
  meta: string;
  status: "ready" | "review";
};
type ToolRun = {
  id: string;
  name: string;
  source: string;
  detail: string;
  status: "success" | "running";
};
type Connector = {
  id: string;
  name: string;
  protocol: string;
  detail: string;
  connected: boolean;
  local: boolean;
};
type RightTab = "outputs" | "brief" | "tools";

const DEMO_BRIEF: Brief = { ...structuredClone(exampleBrief), name: "山野气泡茶新品上市整合营销方案" };
const DEMO_MESSAGES: Message[] = [
  {
    id: 1,
    role: "agent",
    time: "刚刚",
    text: "你好，我是 BlueMark 方案 Agent。我不会只回答一段文案：我会拆解任务、调用工具、生成文件，并把待确认信息单独标出。",
  },
  {
    id: 2,
    role: "user",
    time: "刚刚",
    text: "请为山野气泡茶做新品上市方案，重点做小红书、抖音、微信公众号和视频号。周期 30 天，预算 30 万，最后给我一份可以汇报的 PPT。",
  },
  {
    id: 3,
    role: "agent",
    time: "刚刚",
    text: "任务已拆成 Brief 校验、渠道策略、内容矩阵、合规检查和汇报稿五步。我调用了营销方案 SOP 与演示版品牌资料库，生成了 3 份可下载交付物。",
    tags: ["5 步任务计划", "2 个工具调用", "3 份文件"],
    artifactIds: ["artifact-deck", "artifact-brief", "artifact-matrix"],
    toolRunId: "run-plan",
  },
];

const DEMO_ARTIFACTS: Artifact[] = [
  { id: "artifact-deck", kind: "deck", name: "新品上市整合营销方案.pptx", detail: "8 页可编辑汇报稿", meta: "PPTX · 8 页", status: "ready" },
  { id: "artifact-brief", kind: "brief", name: "执行 Brief 与决策依据.md", detail: "事实、判断与待确认项已分层", meta: "Markdown · 可编辑", status: "ready" },
  { id: "artifact-matrix", kind: "matrix", name: "平台内容矩阵.csv", detail: "按平台拆分内容角色与审核状态", meta: "CSV · 可导入", status: "review" },
];

const DEMO_RUNS: ToolRun[] = [
  { id: "run-brief", name: "Brief 结构校验", source: "bluemark-brief-sop", detail: "9 项必填信息完成 8 项", status: "success" },
  { id: "run-research", name: "读取品牌资料库", source: "brand-library-mcp · 演示", detail: "返回示例标签边界与禁用表述", status: "success" },
  { id: "run-plan", name: "生成营销方案", source: "marketing-plan-skill", detail: "策略、渠道、排期、KPI 与风险已写入", status: "success" },
  { id: "run-deck", name: "构建汇报稿", source: "deck-builder-skill", detail: "生成 8 页可编辑 PPTX", status: "success" },
];

const DEMO_CONNECTORS: Connector[] = [
  { id: "connector-sop", name: "营销方案 SOP", protocol: "Skill", detail: "Brief → 策略 → 内容 → 风险", connected: true, local: true },
  { id: "connector-deck", name: "Deck Builder", protocol: "Skill", detail: "生成可编辑 PPTX 汇报稿", connected: true, local: true },
  { id: "connector-brand", name: "品牌资料库", protocol: "MCP", detail: "演示连接器，不发送外部请求", connected: true, local: true },
  { id: "connector-search", name: "行业研究检索", protocol: "MCP", detail: "接入后可检索一手行业资料", connected: false, local: false },
  { id: "connector-feishu", name: "飞书文档", protocol: "MCP", detail: "接入后可写入团队知识库", connected: false, local: false },
];

const artifactIcon: Record<ArtifactKind, typeof FileText> = {
  deck: WandSparkles,
  brief: FileText,
  matrix: FileSpreadsheet,
  compliance: ShieldCheck,
};

function isBlankBrief(brief: Brief) {
  return briefCompletion(brief) < 70;
}
function briefCompletion(brief: Brief) {
  const checks = [brief.name, brief.brand, brief.product, brief.background, brief.audience, brief.goals.length, brief.platforms.length, brief.budget, brief.duration];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
function nowLabel() {
  return new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function BriefWizard() {
  const state = useApp();
  const navigate = useNavigate();
  const [brief, setBrief] = useState<Brief>(() => (isBlankBrief(state.draft) ? structuredClone(DEMO_BRIEF) : structuredClone(state.draft)));
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [artifacts, setArtifacts] = useState<Artifact[]>(DEMO_ARTIFACTS);
  const [toolRuns, setToolRuns] = useState<ToolRun[]>(DEMO_RUNS);
  const [connectors, setConnectors] = useState<Connector[]>(DEMO_CONNECTORS);
  const [rightTab, setRightTab] = useState<RightTab>("outputs");
  const [activeArtifactId, setActiveArtifactId] = useState("artifact-deck");
  const [activeSlide, setActiveSlide] = useState(0);
  const [composer, setComposer] = useState("");
  const [activeStep, setActiveStep] = useState(5);
  const [thinking, setThinking] = useState(false);
  const [runningTask, setRunningTask] = useState(false);
  const [saved, setSaved] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesEnd = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!state.settings.autoSave) return;
    const timer = setTimeout(() => {
      state.saveDraft(brief);
      setSaved(true);
    }, 500);
    return () => clearTimeout(timer);
  }, [brief, state.settings.autoSave, state.saveDraft]);
  useEffect(() => () => {
    if (replyTimer.current) clearTimeout(replyTimer.current);
  }, []);
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [messages, thinking]);

  function change<K extends keyof Brief>(key: K, value: Brief[K]) {
    setBrief((current) => ({ ...current, [key]: value }));
    setSaved(false);
    setErrors([]);
  }
  function loadDemo() {
    setBrief(structuredClone(DEMO_BRIEF));
    setMessages(DEMO_MESSAGES);
    setArtifacts(DEMO_ARTIFACTS);
    setToolRuns(DEMO_RUNS);
    setConnectors(DEMO_CONNECTORS);
    setActiveStep(5);
    setActiveArtifactId("artifact-deck");
    setActiveSlide(0);
    setRightTab("outputs");
    setSaved(true);
    state.notify("已载入完整 Agent 任务示例");
  }
  function validate() {
    const list: string[] = [];
    if (!brief.name.trim()) list.push("还缺少项目名称");
    if (!brief.brand.trim() || !brief.product.trim()) list.push("还缺少品牌或产品名称");
    if (!brief.background.trim()) list.push("还缺少项目背景");
    if (!brief.audience.trim()) list.push("还缺少目标人群");
    if (!brief.goals.length) list.push("至少选择一个营销目标");
    if (!brief.platforms.length) list.push("至少选择一个传播渠道");
    if (!Number.isFinite(brief.budget) || brief.budget <= 0) list.push("预算需大于 0");
    if (!Number.isInteger(brief.duration) || brief.duration < 1 || brief.duration > 365) list.push("项目周期需为 1–365 天");
    setErrors(list);
    return list.length === 0;
  }
  function submit() {
    if (!validate()) return;
    const id = state.createProject(brief);
    state.addLog(id, "保存 Brief", "Agent 对话与预检交付物已确认");
    navigate(`/app/projects/${id}`);
    void state.run(id);
  }
  function extractFromMessage(value: string) {
    const updates: Partial<Brief> = {};
    const fields: string[] = [];
    const brand = value.match(/品牌(?:是|叫|为)\s*([^，。；,;]+)/)?.[1]?.trim();
    const product = value.match(/产品(?:是|叫|为)\s*([^，。；,;]+)/)?.[1]?.trim();
    const audience = value.match(/(?:目标人群|人群|受众)(?:是|为|包括)\s*([^，。；,;]+)/)?.[1]?.trim();
    const duration = value.match(/(\d+)\s*天/);
    const budget = value.match(/(\d+(?:\.\d+)?)\s*万/);
    if (brand) { updates.brand = brand; fields.push("品牌名称"); }
    if (product) { updates.product = product; fields.push("产品名称"); }
    if (audience) { updates.audience = audience; fields.push("目标人群"); }
    if (duration) { updates.duration = Number(duration[1]); fields.push("项目周期"); }
    if (budget) { updates.budget = Math.round(Number(budget[1]) * 10000); fields.push("预算"); }
    const platforms = PLATFORMS.filter((platform) => value.includes(platform));
    if (platforms.length) { updates.platforms = platforms; fields.push("传播渠道"); }
    const goals = goalOptions.filter((goal) => value.includes(goal));
    if (goals.length) { updates.goals = goals; fields.push("营销目标"); }
    if (Object.keys(updates).length) setBrief((current) => ({ ...current, ...updates }));
    return fields;
  }
  function addToolRun(tool: Omit<ToolRun, "id">) {
    const id = `run-${Date.now()}`;
    setToolRuns((current) => [...current, { ...tool, id }]);
    return id;
  }
  function addMessage(message: Omit<Message, "id" | "time">) {
    setMessages((current) => [...current, { ...message, id: Date.now() + current.length, time: nowLabel() }]);
  }
  async function exportArtifact(artifact: Artifact) {
    try {
      if (artifact.kind === "deck") {
        setThinking(true);
        await downloadMarketingDeck(brief);
        state.notify("可编辑 PPTX 已提交下载");
      } else if (artifact.kind === "brief") {
        downloadBriefMarkdown(brief);
        state.notify("执行 Brief 已提交下载");
      } else if (artifact.kind === "matrix") {
        downloadContentMatrix(brief);
        state.notify("内容矩阵已提交下载");
      } else {
        downloadBriefMarkdown({ ...brief, name: `${brief.name} · 合规检查` });
        state.notify("合规检查表已提交下载");
      }
    } catch (error) {
      state.notify(error instanceof Error ? error.message : "文件生成失败");
    } finally {
      setThinking(false);
    }
  }
  function connectDemoConnector(id: string) {
    const connector = connectors.find((item) => item.id === id);
    if (!connector) return;
    setConnectors((current) => current.map((item) => (item.id === id ? { ...item, connected: !item.connected } : item)));
    const runId = addToolRun({
      name: connector.connected ? `停用 ${connector.name}` : `调用 ${connector.name}`,
      source: `${connector.protocol} · 演示`,
      detail: connector.local ? "本地模拟连接，不发送外部请求" : "仅展示接入位置，尚未配置真实服务",
      status: "success",
    });
    addMessage({
      role: "agent",
      text: connector.connected
        ? `已停止调用“${connector.name}”。演示连接器只改变任务界面，不会修改外部服务。`
        : `已在演示模式启用“${connector.name}”。真实调用需要在模型配置中完成授权，当前不会请求外部服务。`,
      tags: [connector.protocol, connector.local ? "本地演示" : "待配置"],
      toolRunId: runId,
    });
  }
  function generateCompliance() {
    const id = "artifact-compliance";
    setArtifacts((current) => current.some((item) => item.id === id)
      ? current
      : [...current, { id, kind: "compliance", name: "合规与证据边界检查.md", detail: "事实、规划值与禁用表述", meta: "Markdown · 可编辑", status: "ready" }]);
    const runId = addToolRun({
      name: "合规与证据边界检查",
      source: "bluemark-compliance-skill",
      detail: "发现 4 个需人工确认项，0 个阻断项",
      status: "success",
    });
    addMessage({
      role: "agent",
      text: "检查完成：低糖不得写成零糖，不得暗示健康疗效，赠饮需披露，转化结果不得用规划值代替。检查表已加入任务输出。",
      tags: ["4 项待确认", "0 个阻断项"],
      artifactIds: [id],
      toolRunId: runId,
    });
    setActiveArtifactId(id);
    setRightTab("outputs");
  }
  function generateDeckFromPrompt() {
    const runId = addToolRun({
      name: "重构汇报稿",
      source: "deck-builder-skill",
      detail: "已按当前 Brief 刷新 8 页可编辑 PPTX",
      status: "success",
    });
    addMessage({
      role: "agent",
      text: "汇报稿已按当前 Brief 重新排版。它不是把聊天记录塞进幻灯片，而是按“任务结论—人群—策略—渠道—节奏—交付—指标”组织。可在右侧预览并下载 PPTX。",
      tags: ["8 页", "PPTX", "可编辑"],
      artifactIds: ["artifact-deck"],
      toolRunId: runId,
    });
    setActiveArtifactId("artifact-deck");
    setRightTab("outputs");
  }
  function respond(text: string) {
    const value = text.trim();
    if (!value || thinking || runningTask) return;
    const extracted = extractFromMessage(value);
    setMessages((current) => [...current, { id: Date.now(), role: "user", text: value, time: nowLabel() }]);
    setComposer("");
    setThinking(true);

    replyTimer.current = setTimeout(() => {
      if (/PPT|幻灯|汇报稿/i.test(value)) {
        generateDeckFromPrompt();
      } else if (/连接|MCP|资料库|飞书|检索/.test(value)) {
        const target = connectors.find((item) => /品牌资料库|行业研究检索|飞书文档/.test(item.name) && !item.connected) || connectors[2];
        connectDemoConnector(target.id);
      } else if (/合规|风险|检查/.test(value)) {
        generateCompliance();
      } else {
        const hasPlatform = /平台|渠道|小红书|抖音|微信|视频号/.test(value);
        const hasAudience = /人群|用户|白领|消费者|受众/.test(value);
        const response = hasPlatform
          ? "渠道信息已写入 Brief。生成内容时会按平台重写表达、结构和行动指令，不会复用同一段文案。"
          : hasAudience
            ? "目标人群已更新。后续会把“谁、在什么场景、为什么现在尝试”写进策略，而不是只保留人群标签。"
            : "这条信息已进入任务上下文。我会继续区分已确认事实、策略判断和待确认项，并同步到右侧 Brief。";
        addMessage({
          role: "agent",
          text: response,
          tags: extracted.length ? extracted : hasPlatform ? ["渠道分工", "内容格式"] : hasAudience ? ["用户场景", "策略输入"] : ["任务上下文"],
        });
        setActiveStep(hasPlatform ? 4 : hasAudience ? 2 : 3);
        setSaved(false);
      }
      setThinking(false);
    }, 650);
  }
  function runFullTask() {
    if (!validate() || runningTask) return;
    setRunningTask(true);
    setRightTab("outputs");
    const runId = addToolRun({ name: "重建完整任务计划", source: "marketing-plan-skill", detail: "正在拆解目标与资源边界", status: "running" });
    setMessages((current) => [...current, { id: Date.now(), role: "user", text: "按当前 Brief 重新执行完整方案任务。", time: nowLabel() }]);
    replyTimer.current = setTimeout(() => {
      setToolRuns((current) => current.map((item) => (item.id === runId ? { ...item, status: "success", detail: "已生成策略、渠道矩阵与汇报稿" } : item)));
      setArtifacts(DEMO_ARTIFACTS);
      setActiveArtifactId("artifact-deck");
      addMessage({
        role: "agent",
        text: "任务已按当前 Brief 重建。右侧默认展示交付物，不再把方案停留在长段文案里。所有规划值仍需在创建项目后由完整生成流程复核。",
        tags: ["任务完成", "3 份交付物"],
        artifactIds: DEMO_ARTIFACTS.map((item) => item.id),
        toolRunId: runId,
      });
      setRunningTask(false);
      state.notify("Agent 任务已完成，交付物已刷新");
    }, 1150);
  }

  const input = (label: string, key: keyof Brief, multiline = false) => (
    <label className="agent-field">
      <span>{label}</span>
      {multiline
        ? <textarea rows={3} value={String(brief[key])} onChange={(event) => change(key, event.target.value as never)} />
        : <input value={String(brief[key])} onChange={(event) => change(key, event.target.value as never)} />}
    </label>
  );
  const completion = briefCompletion(brief);
  const deck = buildDeckSpec(brief);
  const activeArtifact = artifacts.find((item) => item.id === activeArtifactId) || artifacts[0];
  const activeSlideSpec = deck[activeSlide] || deck[0];

  function renderMessage(message: Message) {
    const isUser = message.role === "user";
    const run = message.toolRunId ? toolRuns.find((item) => item.id === message.toolRunId) : undefined;
    const messageArtifacts = message.artifactIds
      ?.map((id) => artifacts.find((item) => item.id === id))
      .filter((item): item is Artifact => Boolean(item));
    return (
      <article className={`agent-message ${isUser ? "user" : "agent"}`} key={message.id}>
        <span className="message-avatar">{isUser ? <UserRound size={14} /> : <Sparkles size={14} />}</span>
        <div className="message-body">
          <div className="message-meta">
            <strong>{isUser ? "你" : "BlueMark Agent"}</strong>
            <time>{message.time}</time>
          </div>
          <p>{message.text}</p>
          {message.tags?.length ? <div className="message-tags">{message.tags.map((tag) => <span key={tag}><Check size={10} />{tag}</span>)}</div> : null}
          {run ? (
            <button className="message-tool-run" onClick={() => setRightTab("tools")}>
              <Workflow size={14} />
              <span><strong>{run.name}</strong><small>{run.source} · {run.detail}</small></span>
              <CheckCircle2 size={14} />
            </button>
          ) : null}
          {messageArtifacts?.length ? (
            <div className="message-artifacts">
              {messageArtifacts.map((artifact) => {
                const Icon = artifactIcon[artifact.kind];
                return (
                  <button key={artifact.id} onClick={() => { setActiveArtifactId(artifact.id); setRightTab("outputs"); }}>
                    <span className="artifact-icon"><Icon size={16} /></span>
                    <span><strong>{artifact.name}</strong><small>{artifact.detail}</small></span>
                    <ArrowRight size={14} />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </article>
    );
  }

  function renderOutputs() {
    return (
      <>
        <div className="output-summary">
          <div>
            <span className="output-kicker"><CheckCircle2 size={13} /> 任务已完成</span>
            <h2>{artifacts.length} 份可交付成果</h2>
            <p>方案不只是对话文字，而是可下载、可编辑、可继续加工的文件。</p>
          </div>
          <button className="icon-button" title="下载当前文件" aria-label="下载当前文件" onClick={() => exportArtifact(activeArtifact)}><Download size={17} /></button>
        </div>
        <div className="artifact-strip" aria-label="交付物列表">
          {artifacts.map((artifact) => {
            const Icon = artifactIcon[artifact.kind];
            return (
              <button key={artifact.id} className={artifact.id === activeArtifactId ? "active" : ""} onClick={() => { setActiveArtifactId(artifact.id); setActiveSlide(0); }}>
                <span className="artifact-icon"><Icon size={16} /></span>
                <span><strong>{artifact.name}</strong><small>{artifact.meta}</small></span>
                {artifact.status === "review" && <i>待审核</i>}
              </button>
            );
          })}
        </div>
        <section className="artifact-preview">
          <div className="preview-head">
            <div><span>ACTIVE FILE</span><strong>{activeArtifact.name}</strong></div>
            <div className="preview-actions">
              {activeArtifact.kind === "deck" && <span>{activeSlide + 1} / {deck.length}</span>}
              <button className="button button-secondary button-small" onClick={() => exportArtifact(activeArtifact)}><Download size={14} /> 下载</button>
              <button className="icon-button" aria-label="更多操作"><MoreHorizontal size={17} /></button>
            </div>
          </div>
          {activeArtifact.kind === "deck" ? (
            <div className="deck-workspace">
              <div className="deck-slide" data-slide={activeSlide}>
                <div className="deck-slide-eyebrow">{activeSlideSpec.eyebrow}</div>
                <h3>{activeSlideSpec.title}</h3>
                <ul>{activeSlideSpec.bullets.map((item) => <li key={item}>{item}</li>)}</ul>
                {activeSlideSpec.note && <p>{activeSlideSpec.note}</p>}
                <span className="deck-brand">BLUEMARK AGENT</span>
              </div>
              <div className="deck-controls">
                <button className="icon-button" aria-label="上一页" disabled={activeSlide === 0} onClick={() => setActiveSlide((value) => Math.max(0, value - 1))}><ArrowLeft size={16} /></button>
                <div className="deck-thumbnails">
                  {deck.map((slide, index) => (
                    <button key={slide.title} className={index === activeSlide ? "active" : ""} onClick={() => setActiveSlide(index)}>
                      <span>{String(index + 1).padStart(2, "0")}</span>{slide.title}
                    </button>
                  ))}
                </div>
                <button className="icon-button" aria-label="下一页" disabled={activeSlide === deck.length - 1} onClick={() => setActiveSlide((value) => Math.min(deck.length - 1, value + 1))}><ArrowRight size={16} /></button>
              </div>
            </div>
          ) : activeArtifact.kind === "matrix" ? (
            <div className="file-preview">
              <table>
                <thead><tr><th>平台</th><th>内容角色</th><th>数量</th><th>状态</th></tr></thead>
                <tbody>{brief.platforms.map((platform, index) => <tr key={platform}><td><PlatformLogo platform={platform} size="small" /> {platform}</td><td>{index === 0 ? "场景搜索与标签收藏" : index === 1 ? "镜头化产品演示" : "完整解释与转化承接"}</td><td>{index === 0 ? 3 : 2}</td><td><span className="review-chip">待审核</span></td></tr>)}</tbody>
              </table>
            </div>
          ) : (
            <div className="document-preview">
              <span>BLUEMARK / EXECUTION BRIEF</span>
              <h3>{brief.name}</h3>
              <div className="doc-rule" />
              <dl>
                <div><dt>品牌 / 产品</dt><dd>{brief.brand} · {brief.product}</dd></div>
                <div><dt>目标人群</dt><dd>{brief.audience}</dd></div>
                <div><dt>营销目标</dt><dd>{brief.goals.join("、")}</dd></div>
                <div><dt>资源边界</dt><dd>{brief.duration} 天 · {(brief.budget / 10000).toFixed(0)} 万元 · {brief.platforms.join("、")}</dd></div>
              </dl>
              <h4>执行约束</h4>
              <p>{brief.requirements || "待补充"}</p>
            </div>
          )}
        </section>
      </>
    );
  }

  function renderBrief() {
    return (
      <>
        <div className="brief-progress">
          <div><span>Agent 已提取</span><strong>{completion}%</strong></div>
          <div className="brief-progress-bar"><span style={{ width: `${completion}%` }} /></div>
        </div>
        <div className="brief-panel-scroll">
          <section className="brief-card-section">
            <div className="brief-section-title"><span className="brief-section-index">01</span><div><strong>项目与产品</strong><small>事实与待确认项分开记录</small></div></div>
            {input("项目名称", "name")}{input("品牌名称", "brand")}{input("产品名称", "product")}
            <label className="agent-field"><span>所属行业</span><SelectField ariaLabel="所属行业" value={brief.industry} onChange={(value) => change("industry", value)} options={INDUSTRIES.map((industry) => ({ value: industry, label: industry }))} /></label>
            {input("项目背景", "background", true)}
          </section>
          <section className="brief-card-section">
            <div className="brief-section-title"><span className="brief-section-index">02</span><div><strong>人群与目标</strong><small>用于策略，不替代真实用户研究</small></div></div>
            {input("目标人群", "audience", true)}{input("用户需求", "needs", true)}
            <div className="agent-field"><span>营销目标</span><div className="agent-choice-list">{goalOptions.map((goal) => <label key={goal} className={brief.goals.includes(goal) ? "selected" : ""}><input type="checkbox" checked={brief.goals.includes(goal)} onChange={(event) => change("goals", event.target.checked ? [...brief.goals, goal] : brief.goals.filter((item) => item !== goal))} /><span>{goal}</span></label>)}</div></div>
          </section>
          <section className="brief-card-section">
            <div className="brief-section-title"><span className="brief-section-index">03</span><div><strong>渠道与资源</strong><small>不同平台使用不同内容角色</small></div></div>
            <div className="agent-field"><span>传播渠道</span><div className="agent-choice-list platform-choices">{PLATFORMS.map((platform: Platform) => <label key={platform} className={brief.platforms.includes(platform) ? "selected" : ""}><input type="checkbox" checked={brief.platforms.includes(platform)} onChange={(event) => change("platforms", event.target.checked ? [...brief.platforms, platform] : brief.platforms.filter((item) => item !== platform))} /><PlatformLogo platform={platform} size="small" /><span>{platform}</span></label>)}</div></div>
            <div className="agent-inline-fields">
              <label className="agent-field"><span>预算（元）</span><input type="number" min={1} value={brief.budget} onChange={(event) => change("budget", Number(event.target.value))} /></label>
              <label className="agent-field"><span>周期（天）</span><input type="number" min={1} max={365} value={brief.duration} onChange={(event) => change("duration", Number(event.target.value))} /></label>
            </div>
            {input("品牌语气", "tone", true)}
          </section>
          <section className="brief-card-section">
            <div className="brief-section-title"><span className="brief-section-index">04</span><div><strong>约束与交付</strong><small>发布前仍需人工确认</small></div></div>
            {input("产品卖点", "sellingPoints", true)}{input("交付要求与其他约束", "requirements", true)}
          </section>
        </div>
        {errors.length > 0 && <div className="agent-errors" role="alert">{errors.map((error) => <div key={error}>{error}</div>)}</div>}
        <div className="brief-panel-actions">
          <button className="button button-ghost" onClick={() => { if (window.confirm("清空当前 Brief 草稿？")) { setBrief(structuredClone(emptyBrief)); setMessages(DEMO_MESSAGES.slice(0, 1)); setArtifacts([]); setActiveStep(0); state.saveDraft(structuredClone(emptyBrief)); } }}><RotateCcw size={15} /> 清空</button>
          <button className="button button-ghost" onClick={() => { state.saveDraft(brief); setSaved(true); state.notify("Brief 草稿已保存"); }}><Save size={15} /> 暂存</button>
          <button className="button button-primary" onClick={submit}><Sparkles size={15} /> 创建项目并生成</button>
        </div>
      </>
    );
  }

  function renderTools() {
    return (
      <>
        <div className="tools-intro">
          <span className="output-kicker"><Plug size={13} /> TOOLBOX</span>
          <h2>Skills 与 MCP 连接器</h2>
          <p>当前为本地演示：连接开关用于展示 Agent 形态，不会请求或修改外部服务。</p>
        </div>
        <div className="tool-section">
          <h3>任务工具链</h3>
          {toolRuns.map((run) => (
            <div className="tool-run-row" key={run.id}>
              <span className={run.status === "running" ? "tool-status running" : "tool-status"}>{run.status === "running" ? <LoaderCircle size={13} /> : <Check size={13} />}</span>
              <div><strong>{run.name}</strong><small>{run.source}</small><p>{run.detail}</p></div>
            </div>
          ))}
        </div>
        <div className="tool-section">
          <h3>可用连接</h3>
          {connectors.map((connector) => (
            <div className={`connector-row ${connector.connected ? "connected" : ""}`} key={connector.id}>
              <span className="connector-icon">{connector.protocol === "MCP" ? <Database size={16} /> : <Hammer size={16} />}</span>
              <div><strong>{connector.name}</strong><small>{connector.protocol}{connector.local ? " · 本地演示" : " · 待配置"}</small><p>{connector.detail}</p></div>
              <button onClick={() => connectDemoConnector(connector.id)}>{connector.connected ? "停用" : "启用"}</button>
            </div>
          ))}
        </div>
        <div className="tools-footnote"><CircleDot size={13} /> 真实 MCP 授权入口保留在“模型配置”；演示页不保存凭证。</div>
      </>
    );
  }

  return (
    <>
      <div className="agent-shell">
        <section className="agent-conversation" aria-label="Agent 对话与任务运行">
          <div className="agent-conversation-head">
            <div className="agent-identity">
              <span className="agent-avatar"><Sparkles size={17} /></span>
              <div><strong>BlueMark 方案 Agent</strong><span><i /> 可规划、可调用工具、可产出文件</span></div>
            </div>
            <div className="agent-head-actions">
              <span className="agent-model">Mock Runtime</span>
              <button className="icon-button" onClick={runFullTask} disabled={runningTask} title={runningTask ? "任务执行中" : "运行任务"} aria-label="运行任务">{runningTask ? <LoaderCircle className="spin" size={16} /> : <Play size={16} />}</button>
              <button className="icon-button" onClick={loadDemo} title="载入完整示例" aria-label="载入完整示例"><FileInput size={16} /></button>
              <button className="icon-button" onClick={() => setRightTab("tools")} title="工具与连接器" aria-label="查看工具与连接器"><Plug size={16} /></button>
            </div>
          </div>
          <div className="agent-sop">
            <div className="agent-sop-title"><span>任务计划</span><strong>{activeStep + 1} / 6</strong></div>
            <div className="agent-sop-track">
              {steps.map(([label, detail], index) => (
                <button key={label} className={`agent-sop-step ${index === activeStep ? "active" : ""} ${index < activeStep ? "done" : ""}`} onClick={() => setActiveStep(index)}>
                  <span>{index < activeStep ? <Check size={11} /> : index + 1}</span>
                  <span><strong>{label}</strong><small>{detail}</small></span>
                </button>
              ))}
            </div>
          </div>
          <div className="agent-messages">
            {messages.map(renderMessage)}
            {thinking ? <div className="agent-message agent"><span className="message-avatar"><Sparkles size={14} /></span><div className="message-body"><div className="message-meta"><strong>BlueMark Agent</strong><time>正在处理</time></div><div className="thinking-dots"><span /><span /><span /></div></div></div> : null}
            <div ref={messagesEnd} />
          </div>
          <div className="agent-composer">
            <div className="quick-prompts">
              <button onClick={() => respond("把当前策略整理成一份可汇报的 PPT")}>整理成 PPT</button>
              <button onClick={() => respond("连接品牌资料库，检查产品表述边界")}>调用品牌资料库</button>
              <button onClick={() => respond("检查方案的合规风险")}>检查合规</button>
              <button onClick={() => setRightTab("brief")}>查看 Brief</button>
            </div>
            <div className="composer-input">
              <textarea value={composer} placeholder="继续补充信息，或要求 Agent 调用工具、生成 PPT、检查方案…" onChange={(event) => setComposer(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); respond(composer); } }} />
              <button className="composer-attach" aria-label="添加附件"><Paperclip size={16} /></button>
              <button className="send-button" aria-label="发送消息" onClick={() => respond(composer)} disabled={!composer.trim() || thinking}><Send size={17} /></button>
            </div>
            <span className="composer-hint"><MessageCircle size={13} /> 对话、工具记录与文件产出在同一个任务上下文中</span>
          </div>
        </section>

        <aside className="agent-output-panel" aria-label="Agent 任务输出">
          <div className="agent-output-tabs" role="tablist">
            <button role="tab" aria-selected={rightTab === "outputs"} className={rightTab === "outputs" ? "active" : ""} onClick={() => setRightTab("outputs")}><FolderKanban size={15} /> 任务输出 <span>{artifacts.length}</span></button>
            <button role="tab" aria-selected={rightTab === "brief"} className={rightTab === "brief" ? "active" : ""} onClick={() => setRightTab("brief")}><FileText size={15} /> 实时 Brief</button>
            <button role="tab" aria-selected={rightTab === "tools"} className={rightTab === "tools" ? "active" : ""} onClick={() => setRightTab("tools")}><Plug size={15} /> 工具 <span>{connectors.filter((item) => item.connected).length}</span></button>
          </div>
          <div className="agent-output-body">
            {rightTab === "outputs" ? renderOutputs() : rightTab === "brief" ? renderBrief() : renderTools()}
          </div>
        </aside>
      </div>
      <div className="agent-builder-footer">
        <Link className="text-link" to="/app/projects"><ArrowLeft size={15} /> 返回项目</Link>
        <span><ScanSearch size={13} /> 右侧文件可直接下载；创建项目后进入完整生成与审核</span>
        <span className="agent-footer-next">当前为本地演示，不请求外部服务 <ChevronRight size={14} /></span>
      </div>
    </>
  );
}
