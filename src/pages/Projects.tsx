import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  FileText,
  FolderOpen,
  MoreHorizontal,
  Plus,
  Star,
  Trash2,
  Archive,
  Clock3,
  Sparkles,
} from "lucide-react";
import { useApp } from "../store";
import { formatTime, INDUSTRIES } from "../domain";
import type { Project } from "../domain";
import {
  Badge,
  Empty,
  Modal,
  PageHeader,
  SearchInput,
  Status,
} from "../components/ui";
import { PlatformLogo } from "../components/PlatformLogo";
import { SelectField } from "../components/SelectField";

export function ProjectActions({ project }: { project: Project }) {
  const [open, setOpen] = useState(false),
    [confirm, setConfirm] = useState(false);
  const { duplicateProject, deleteProject, updateProject, addLog, notify } =
    useApp();
  const navigate = useNavigate();
  return (
    <div className="row-actions">
      <button
        className="icon-button"
        title="复制为新项目"
        onClick={() => {
          const id = duplicateProject(project.id);
          notify("已复制为新项目");
          navigate(`/app/projects/${id}`);
        }}
      >
        <Copy size={16} />
      </button>
      <button
        className="icon-button"
        title="项目操作"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <MoreHorizontal size={19} />
      </button>
      {open && (
        <div className="row-menu">
          <button
            onClick={() => {
              updateProject(project.id, {
                status: project.status === "已归档" ? "草稿" : "已归档",
              });
              addLog(
                project.id,
                project.status === "已归档" ? "恢复项目" : "归档项目",
                "状态已更新",
              );
              setOpen(false);
            }}
            disabled={project.status === "生成中"}
          >
            <Archive size={15} />
            {project.status === "已归档" ? "恢复项目" : "归档"}
          </button>
          <button
            className="danger-text"
            onClick={() => {
              setConfirm(true);
              setOpen(false);
            }}
            disabled={project.status === "生成中"}
          >
            <Trash2 size={15} />
            删除
          </button>
        </div>
      )}
      {confirm && (
        <Modal title="删除项目" onClose={() => setConfirm(false)}>
          <p>
            确定删除「{project.brief.name}
            」？项目内容将被移除，历史操作记录会保留。
          </p>
          <div className="modal-actions">
            <button
              className="button button-secondary"
              onClick={() => setConfirm(false)}
            >
              取消
            </button>
            <button
              className="button button-danger"
              onClick={() => {
                deleteProject(project.id);
                setConfirm(false);
                notify("项目已删除");
              }}
            >
              删除项目
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
export function ProjectTable({ projects }: { projects: Project[] }) {
  return projects.length ? (
    <div className="table-wrap">
      <table className="data-table project-table">
        <thead>
          <tr>
            <th>项目名称</th>
            <th>品牌 / 行业</th>
            <th>状态</th>
            <th>渠道</th>
            <th>
              最近更新 <ArrowDown size={12} />
            </th>
            <th aria-label="操作" />
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="project-name-cell">
                  <div
                    className={`project-tile ${p.brief.industry.includes("食品") ? "tile-green" : "tile-blue"}`}
                  >
                    <FolderOpen size={19} />
                  </div>
                  <div>
                    <Link to={`/app/projects/${p.id}`} className="project-name">
                      {p.brief.name}
                    </Link>
                    <span className="table-sub">
                      {p.isExample
                        ? "内置示例"
                        : p.sourceCaseId
                          ? "复用项目"
                          : "营销项目"}{" "}
                      · {p.brief.duration} 天 · ¥
                      {p.brief.budget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <strong className="table-regular">{p.brief.brand}</strong>
                <span className="table-sub">{p.brief.industry}</span>
              </td>
              <td>
                <Status value={p.status} />
              </td>
              <td>
                <div className="platform-dots">
                  {p.brief.platforms.slice(0, 3).map((v) => (
                    <PlatformLogo platform={v} key={v} />
                  ))}
                  {p.brief.platforms.length > 3 && (
                    <small>+{p.brief.platforms.length - 3}</small>
                  )}
                </div>
              </td>
              <td className="muted nowrap">{formatTime(p.updatedAt)}</td>
              <td>
                <ProjectActions project={p} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty title="暂无匹配项目">
      <Link to="/app/projects/new" className="button button-primary">
        <Plus size={16} />
        新建项目
      </Link>
    </Empty>
  );
}
export function Dashboard() {
  const { projects, logs, config } = useApp();
  const featured =
    projects.find((project) => project.id === "case-dji-osmo-360-2026") ||
    projects.find((project) => project.isExample);
  const active = projects.filter((p) => p.status !== "已归档"),
    pending = projects.reduce(
      (n, p) =>
        n +
        (p.solution.contents?.filter((c) => c.review !== "已审核").length || 0),
      0,
    ),
    recent = [...projects]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 4);
  const ongoing = active.filter((project) => project.status !== "已完成").length;
  const cases = projects.filter((project) => project.isCase).length;
  const stats = [
    {
      label: "全部项目",
      value: projects.length,
      tone: "blue",
      icon: FolderOpen,
      href: "/app/projects",
    },
    {
      label: "进行中",
      value: ongoing,
      tone: "amber",
      icon: Clock3,
      href: "/app/projects",
    },
    {
      label: "已保存案例",
      value: cases,
      tone: "green",
      icon: BookOpen,
      href: "/app/cases",
    },
    {
      label: "待审核内容",
      value: pending,
      tone: "coral",
      icon: FileText,
      href: "/app/content",
    },
  ];
  return (
    <>
      <PageHeader
        title="工作台"
        hideTitle
        actions={
          <Link className="button button-primary" to="/app/projects/new">
            <Plus size={17} />
            新建项目
          </Link>
        }
      />
      <section className="stats-grid" aria-label="工作台指标">
        {stats.map(({ label, value, tone, icon: Icon, href }) => (
          <Link
            className="stat"
            data-tone={tone}
            key={label}
            to={href}
            aria-label={`${label} ${value}`}
          >
            <div className="stat-label">
              <span>{label}</span>
              <Icon size={18} />
            </div>
            <strong>{value}</strong>
          </Link>
        ))}
      </section>
      <section className="featured-project">
        <div className="feature-copy">
          <h2>{featured?.brief.name || "开始一份新的营销方案"}</h2>
          <p>{featured?.brief.tone || "从 Brief 开始整理下一步。"}</p>
          <div className="feature-tags">
            <span>{featured?.brief.industry || "待选择行业"}</span>
            <span>{featured?.brief.duration || 0} 天传播周期</span>
            <span>¥{(featured?.brief.budget || 0).toLocaleString()} 预算</span>
            <span>{featured?.isExample ? "示例" : "项目"}</span>
          </div>
          <Link
            to={
              featured
                ? `/app/cases/${featured.id}`
                : "/app/cases"
            }
            className="button button-secondary feature-link"
          >
            查看完整方案 <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="campaign-art">
          <img
            src={`${import.meta.env.BASE_URL}assets/${featured?.id === "case-dji-osmo-360-2026" ? "dji-osmo-360.jpg" : "shanye-campaign.jpg"}`}
            alt={featured?.id === "case-dji-osmo-360-2026" ? "大疆 Osmo 360 全景相机示例配图" : "草本茶饮场景概念配图，非山野气泡茶真实产品图"}
          />
        </div>
      </section>
      <section className="section recent-section">
        <div className="section-head">
          <div>
            <h2>
              最近编辑项目{" "}
              <span className="count-label">{projects.length}</span>
            </h2>
          </div>
          <Link className="text-link" to="/app/projects">
            全部项目 <ArrowRight size={15} />
          </Link>
        </div>
        <ProjectTable projects={recent} />
      </section>
      <div className="dashboard-bottom">
        <section className="section activity-section">
          <div className="section-head">
            <h2>最近使用记录</h2>
            <Link className="text-link" to="/app/usage">
              查看全部 <ArrowRight size={15} />
            </Link>
          </div>
          {logs.length ? (
            <div className="activity-list">
              {logs.slice(0, 4).map((log) => (
                <div className="activity-row" key={log.id}>
                  <span
                    className={`activity-mark ${!log.success ? "activity-failed" : ""}`}
                  >
                    {log.success ? <Check size={14} /> : <Clock3 size={14} />}
                  </span>
                  <div>
                    <strong>{log.action}</strong>
                    {log.isExample && (
                      <span className="sample-label">示例</span>
                    )}
                    <span className="table-sub">{log.projectName}</span>
                  </div>
                  <time>{formatTime(log.time)}</time>
                </div>
              ))}
            </div>
          ) : (
            <Empty title="尚无操作记录" />
          )}
        </section>
        <section className="model-summary">
          <div className="section-head">
            <h2>模型连接</h2>
            <span className="status-dot" />
          </div>
          <span className="model-mark">
            <Sparkles size={22} />
          </span>
          <h3>{config.mock ? "Mock Provider" : config.model}</h3>
          <Badge
            tone={
              config.mock
                ? "green"
                : config.connection === "success"
                  ? "green"
                  : "orange"
            }
          >
            {config.mock
              ? "本地就绪"
              : config.connection === "success"
                ? "连接正常"
                : "待测试"}
          </Badge>
          <p>
            {config.mock ? "本次生成不发送外部请求" : "OpenAI-Compatible API"}
          </p>
          <Link to="/app/model-config" className="text-link">
            管理模型配置 <ArrowRight size={15} />
          </Link>
        </section>
      </div>
    </>
  );
}
export function ProjectList() {
  const projects = useApp((s) => s.projects);
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("全部状态"),
    [industry, setIndustry] = useState("全部行业"),
    [order, setOrder] = useState("updated");
  const filtered = projects
    .filter(
      (p) =>
        (status === "全部状态" || p.status === status) &&
        (industry === "全部行业" || p.brief.industry === industry) &&
        `${p.brief.name} ${p.brief.brand}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      order === "updated"
        ? b.updatedAt.localeCompare(a.updatedAt)
        : b.createdAt.localeCompare(a.createdAt),
    );
  return (
    <>
      <PageHeader
        title="项目"
        meta={`${projects.length} 个项目`}
        hideTitle
        actions={
          <Link to="/app/projects/new" className="button button-primary">
            <Plus size={17} />
            新建项目
          </Link>
        }
      />
      <div className="toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="搜索项目或品牌"
        />
        <SelectField
          ariaLabel="项目状态"
          value={status}
          onChange={setStatus}
          options={["全部状态", "草稿", "生成中", "待审核", "已完成", "已归档"].map((value) => ({ value, label: value }))}
        />
        <SelectField
          ariaLabel="项目行业"
          value={industry}
          onChange={setIndustry}
          options={["全部行业", ...INDUSTRIES].map((value) => ({ value, label: value }))}
        />
        <SelectField
          className="sort-select"
          ariaLabel="排序"
          value={order}
          onChange={setOrder}
          options={[
            { value: "updated", label: "最近更新" },
            { value: "created", label: "最近创建" },
          ]}
        />
      </div>
      <section className="section">
        <ProjectTable projects={filtered} />
      </section>
    </>
  );
}
export function CasesPage() {
  const projects = useApp((s) => s.projects),
    update = useApp((s) => s.updateProject);
  const [query, setQuery] = useState(""),
    [industry, setIndustry] = useState("全部行业"),
    [favorite, setFavorite] = useState(false),
    [tag, setTag] = useState("全部目标");
  const cases = projects
    .filter(
      (p) =>
        p.isCase &&
        (industry === "全部行业" || p.brief.industry === industry) &&
        (tag === "全部目标" || p.brief.goals.includes(tag)) &&
        (!favorite || p.favorite) &&
        `${p.brief.name} ${p.brief.brand}`.includes(query),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const tags = [
    ...new Set(projects.filter((p) => p.isCase).flatMap((p) => p.brief.goals)),
  ];
  return (
    <>
      <PageHeader
        title="案例库"
        hideTitle
        actions={
          <Link to="/app/projects/new" className="button button-primary">
            <Plus size={17} />
            创建方案
          </Link>
        }
      />
      <div className="toolbar">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="搜索案例或品牌"
        />
        <SelectField
          ariaLabel="案例行业"
          value={industry}
          onChange={setIndustry}
          options={["全部行业", ...INDUSTRIES].map((value) => ({ value, label: value }))}
        />
        <SelectField
          ariaLabel="案例目标"
          value={tag}
          onChange={setTag}
          options={["全部目标", ...tags].map((value) => ({ value, label: value }))}
        />
        <button
          className={`button ${favorite ? "button-soft" : "button-secondary"}`}
          onClick={() => setFavorite(!favorite)}
        >
          <Star size={15} fill={favorite ? "currentColor" : "none"} />
          仅收藏
        </button>
        <span className="toolbar-count">{cases.length} 个案例 · 最近更新</span>
      </div>
      {cases.length ? (
        <div className="case-grid">
          {cases.map((p) => (
            <article className="case-card" key={p.id}>
              <Link
                className={`case-cover ${p.isExample ? "" : "case-cover-generic"}`}
                to={`/app/cases/${p.id}`}
              >
                {p.isExample ? (
                  <img
                    src={`${import.meta.env.BASE_URL}assets/${p.id === "case-dji-osmo-360-2026" ? "dji-osmo-360.jpg" : "shanye-campaign.jpg"}`}
                    alt={p.id === "case-dji-osmo-360-2026" ? "大疆 Osmo 360 全景相机示例配图" : "山野气泡茶概念场景"}
                  />
                ) : (
                  <BookOpen size={54} />
                )}
                <Badge tone="neutral">
                  {p.isExample ? "内置虚构示例" : "用户案例"}
                </Badge>
              </Link>
              <div className="case-card-body">
                <div className="case-meta">
                  <span>{p.brief.industry}</span>
                  <button
                    className={`icon-button ${p.favorite ? "favorite-active" : ""}`}
                    title={p.favorite ? "取消收藏" : "收藏案例"}
                    onClick={() => update(p.id, { favorite: !p.favorite })}
                  >
                    <Star
                      size={17}
                      fill={p.favorite ? "currentColor" : "none"}
                    />
                  </button>
                </div>
                <h2>
                  <Link to={`/app/cases/${p.id}`}>{p.brief.name}</Link>
                </h2>
                <p>
                  {p.brief.brand} · {p.brief.goals.join(" / ")}
                </p>
                <div className="case-card-footer">
                  <Status value={p.status} />
                  <time>{formatTime(p.updatedAt)}</time>
                  <Link
                    to={`/app/cases/${p.id}`}
                    className="icon-button"
                    title="查看案例"
                  >
                    <ArrowUpRight size={18} />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty title="没有匹配的案例">
          <Link to="/app/projects" className="text-link">
            查看项目
          </Link>
        </Empty>
      )}
    </>
  );
}
