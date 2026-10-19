import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Layers3,
  MessageCircle,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import { Logo } from "../components/Logo";
import { useApp } from "../store";
import { PlatformLogo } from "../components/PlatformLogo";
import { AmbientBackdrop } from "../components/AmbientBackdrop";
import type { Platform } from "../domain";
import "./landing.css";

const FLOW = [
  { label: "Brief 输入", meta: "目标、产品与限制" },
  { label: "用户洞察", meta: "人群与使用场景" },
  { label: "策略设计", meta: "定位、创意与节奏" },
  { label: "内容生产", meta: "按渠道生成草案" },
  { label: "人工审核", meta: "事实、风险与授权" },
  { label: "方案交付", meta: "导出并进入执行" },
];

const CHANNELS = [
  { name: "小红书", short: "小", tone: "red", title: "把种草写成一篇能审核的笔记", detail: "从人群洞察到笔记结构、封面方向和合作披露，保留每一条待确认信息。", format: "笔记 · 3 条草案" },
  { name: "抖音", short: "抖", tone: "black", title: "把创意拆成可以拍摄的脚本", detail: "按镜头、口播、字幕和制作要求组织短视频内容，不把策划假设写成实拍结果。", format: "脚本 · 30 秒竖屏" },
  { name: "微信公众号", short: "微", tone: "green", title: "把策略落成完整的长内容", detail: "围绕产品信息、用户问题和官方入口生成文章提纲，重点事实逐项回到审核。", format: "提纲 · 1,000-1,500 字" },
];

const ABILITIES = [
  { icon: Layers3, index: "01", name: "结构化营销方案", detail: "从 Brief 开始，依次整理洞察、定位、策略、创意、矩阵、排期和 KPI。", accent: "blue" },
  { icon: MessageCircle, index: "02", name: "多平台内容生产", detail: "小红书、抖音、公众号和视频号使用各自的内容格式，不把一份文案硬套到所有渠道。", accent: "coral" },
  { icon: ScanSearch, index: "03", name: "人工审核与风险提示", detail: "事实、授权、商业披露、隐私和归因分开检查，明确哪些内容仍然需要确认。", accent: "green" },
  { icon: FileText, index: "04", name: "案例复用与方案导出", detail: "复制已有案例，保留结构并重置审核状态，最后导出 Markdown、JSON 或 HTML。", accent: "yellow" },
];

export function Landing() {
  const example = useApp((s) => s.projects.find((p) => p.isExample));
  const caseHref = example ? `/app/cases/${example.id}` : "/app/cases";
  const asset = (name: string) => `${import.meta.env.BASE_URL}assets/${name}`;
  const [activeChannel, setActiveChannel] = useState(0);

  return (
    <div className="landing">
      <AmbientBackdrop />
      <header className="landing-nav">
        <Link to="/" aria-label="BlueMark 首页"><Logo /></Link>
        <nav aria-label="页面导航"><a href="#capabilities">能力</a><a href="#channels">渠道</a><a href="#example">案例</a></nav>
        <Link to="/app" className="landing-nav-cta">进入工作台 <ArrowUpRight size={15} /></Link>
      </header>

      <main>
        <section className="landing-hero" id="product">
          <div className="hero-copy reveal is-visible">
            <span className="hero-kicker"><Sparkles size={14} /> AI 营销方案工作台</span>
            <h1><span className="hero-title-line">让营销想法</span><span className="hero-title-line"><em>变成可执行方案</em></span></h1>
            <p>从 Brief、洞察到内容审核与交付，让每一个营销项目都有清晰的下一步。</p>
            <div className="hero-actions"><Link to="/app" className="button button-primary hero-cta">开始创建方案 <ArrowRight size={17} /></Link><a href="#channels" className="hero-text-link">看看适用渠道 <ArrowDown size={15} /></a></div>
            <div className="hero-proof"><span><Check size={14} /> Mock 模式可直接体验</span><span><Check size={14} /> 不自动发布内容</span></div>
          </div>
          <figure className="hero-stage reveal is-visible">
            <div className="stage-orbit stage-orbit-one" /><div className="stage-orbit stage-orbit-two" />
            <div className="stage-note note-brief"><span className="note-dot blue" /> Brief 已解析</div><div className="stage-note note-content"><span className="note-dot coral" /> 11 条内容待审核</div><div className="stage-note note-ready"><span className="note-dot green" /> 方案已就绪</div>
            <div className="stage-frame"><div className="stage-chrome"><span className="dots" aria-hidden="true"><i /><i /><i /></span><span>BlueMark 工作台</span></div><img className="stage-shot" src={asset("workspace-preview.png")} alt="BlueMark 工作台总览界面" width={1440} height={900} /></div>
          </figure>
        </section>

        <section className="landing-channels" id="channels">
          <div className="section-intro"><span className="section-number">01 / 渠道场景</span><h2>不是把内容复制到平台，<br /><strong>而是按场景重新组织。</strong></h2><p>不同渠道有不同的内容节奏。BlueMark 把渠道差异放回方案里，让策略和执行保持一条线。</p></div>
          <div className="channel-showcase"><div className="channel-tabs" role="tablist" aria-label="营销渠道">{CHANNELS.map((channel, index) => <button key={channel.name} role="tab" aria-selected={activeChannel === index} className={`channel-tab ${channel.tone} ${activeChannel === index ? "active" : ""}`} onClick={() => setActiveChannel(index)}><PlatformLogo platform={channel.name as Platform} size="medium" /><span>{channel.name}</span><ArrowUpRight size={14} /></button>)}</div><article className={`channel-preview ${CHANNELS[activeChannel].tone}`}><div className="preview-meta"><span>{CHANNELS[activeChannel].format}</span><span className="preview-status"><i /> 待审核</span></div><h3>{CHANNELS[activeChannel].title}</h3><p>{CHANNELS[activeChannel].detail}</p><div className="preview-lines"><span /><span /><span /><span className="short" /></div><div className="preview-footer"><span>BlueMark 内容工厂</span><ArrowRight size={16} /></div></article></div>
        </section>

        <section className="landing-flow" id="workflow"><div className="flow-head"><span className="section-number">02 / 工作流程</span><h2>从 Brief 到交付，<br /><strong>每一步都看得见。</strong></h2></div><ol className="flow-track">{FLOW.map((step, i) => <li key={step.label}><span className="flow-index">0{i + 1}</span><span className="flow-node"><b>{step.label}</b><small>{step.meta}</small></span>{i < FLOW.length - 1 && <span className="flow-link" aria-hidden="true" />}</li>)}</ol></section>

        <section className="landing-abilities" id="capabilities"><div className="abilities-heading"><span className="section-number">03 / 平台能力</span><h2>把营销项目里最费时间的部分，<br /><strong>交给一个清晰的工作台。</strong></h2></div><div className="ability-grid">{ABILITIES.map(({ icon: Icon, ...item }) => <article key={item.name} className={`ability-card ${item.accent}`}><div className="ability-card-top"><span className="ability-index">{item.index}</span><Icon size={22} /></div><h3>{item.name}</h3><p>{item.detail}</p><ArrowUpRight className="ability-arrow" size={18} /></article>)}</div></section>

        <section className="landing-case" id="example"><div className="case-media"><img src={asset("shanye-campaign.jpg")} alt="山野气泡茶案例的草本茶饮场景概念配图" /><div className="case-sticker"><span>CASE 01</span><strong>新品上市<br />整合营销</strong></div></div><div className="case-panel"><span className="section-number">04 / 示例案例</span><h2>山野气泡茶<br /><strong>新品上市整合营销方案</strong></h2><p>从一个真实的产品 Brief 出发，生成 3 个创意方向和 11 条平台内容草案。</p><div className="case-stats"><div><strong>30</strong><span>天传播周期</span></div><div><strong>4</strong><span>个重点平台</span></div><div><strong>11</strong><span>条内容草案</span></div></div><Link to={caseHref} className="case-link">打开案例详情 <ArrowUpRight size={15} /></Link><p className="case-note">内置虚构示例，预算与 KPI 均为规划值，实际效果未采集。</p></div></section>

        <section className="landing-final-cta">
          <div className="cta-copy">
            <span className="section-number">从一句 Brief 开始</span>
            <h2>把下一份营销方案，<br /><em>交给方案 Agent。</em></h2>
            <p>说出目标与约束，Agent 会继续拆解任务、调用工具，并产出可下载的 PPT、内容矩阵和审核清单。</p>
            <div className="cta-output-list" aria-label="Agent 输出">
              <span><FileText size={15} /> 可编辑 PPT</span>
              <span><Layers3 size={15} /> 平台内容矩阵</span>
              <span><Check size={15} /> 合规与证据边界</span>
            </div>
          </div>
          <div className="cta-actions-panel">
            <span>BLUEMARK AGENT</span>
            <strong>准备好 Brief 了吗？</strong>
            <p>进入工作台后，可以载入完整示例，也可以直接描述你的项目。</p>
            <Link to="/app/projects/new" className="button button-primary">进入方案 Agent <ArrowRight size={17} /></Link>
            <Link to={caseHref} className="cta-secondary-link">先看示例案例 <ArrowUpRight size={15} /></Link>
            <small>本地 Mock 演示，不自动发布，不请求外部模型服务。</small>
          </div>
        </section>
      </main>
      <footer className="landing-footer"><Logo /><p>独立面试展示项目，与蓝色光标无官方关联。项目数据保存在当前浏览器。</p></footer>
    </div>
  );
}
