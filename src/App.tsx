import { Component, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import {
  Link,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BookOpen,
  CircleHelp,
  FolderOpen,
  Grid2X2,
  History,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useApp } from "./store";
import { formatTime } from "./domain";
import { Badge, Toast } from "./components/ui";
import { Dashboard, ProjectList, CasesPage } from "./pages/Projects";
import { BriefWizard } from "./pages/BriefWizard";
import { ProjectDetail } from "./pages/ProjectDetail";
import {
  ContentPage,
  UsagePage,
  ModelConfigPage,
  SettingsPage,
} from "./pages/Operations";
import { Landing } from "./pages/Landing";
import { Logo } from "./components/Logo";
import { AmbientBackdrop } from "./components/AmbientBackdrop";
const nav = [
  { path: "/app", label: "总览", icon: LayoutDashboard, end: true },
  { path: "/app/projects", label: "项目", icon: FolderOpen, end: true },
  { path: "/app/projects/new", label: "新建方案", icon: Plus },
  { path: "/app/content", label: "内容工厂", icon: Grid2X2 },
  { path: "/app/cases", label: "案例库", icon: BookOpen },
  { path: "/app/usage", label: "使用记录", icon: History },
];
function Shell() {
  const location = useLocation(),
    [open, setOpen] = useState(false);
  const { projects, config, saveError } = useApp();
  const match = location.pathname.match(/\/(?:projects|cases)\/([^/]+)$/);
  const project = match ? projects.find((p) => p.id === match[1]) : undefined;
  const pending = projects.reduce(
    (sum, p) =>
      sum +
      (p.solution.contents?.filter((c) => c.review !== "已审核").length || 0),
    0,
  );
  useEffect(() => {
    setOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return (
    <div className="app-shell">
      <AmbientBackdrop />
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="收起导航"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <Link to="/" className="logo-link" aria-label="返回 BlueMark 产品首页">
          <Logo />
        </Link>
        <div className="nav-group-label nav-group-label-primary">工作台</div>
        <nav>
          {nav.map(({ path, label, icon: Icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "内容工厂" && pending > 0 && (
                <span className="nav-count">{pending}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="nav-group-label">管理</div>
          <NavLink
            to="/app/model-config"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <SlidersHorizontal size={18} />
            模型配置
          </NavLink>
          <NavLink
            to="/app/settings"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <Settings size={18} />
            设置
          </NavLink>
          <div className="sidebar-status">
            <span className="status-dot" />
            <div>
              <strong>{config.mock ? "Mock 模式" : "模型服务"}</strong>
              <Link to="/app/model-config">
                {config.mock ? "本地示例已就绪" : config.model}
                <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
          <Link to="/" className="back-home">
            <ArrowLeft size={14} />
            产品首页
            <ArrowUpRight size={13} />
          </Link>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              title="展开导航"
              className="icon-button nav-toggle"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span className="workspace-title">BlueMark</span>
            <span className="breadcrumb-slash">/</span>
            <span className="breadcrumb-current">
              {project?.brief.name ||
                nav.find((n) => n.path === location.pathname)?.label ||
                (location.pathname.includes("model-config")
                  ? "模型配置"
                  : "设置")}
            </span>
            {project && <Badge tone="blue">{project.status}</Badge>}
          </div>
          <div className="topbar-actions">
            {project && (
              <span className="last-saved">
                已保存 {formatTime(project.updatedAt)}
              </span>
            )}
            <Link to="/app/model-config" className="model-indicator">
              <span className={`status-dot ${config.mock ? "" : "dot-blue"}`} />
              {config.mock ? "Mock 已就绪" : config.model}
            </Link>
            <Link to="/app/usage" className="icon-button" title="使用记录">
              <Bell size={18} />
              {pending > 0 && <i />}
            </Link>
          </div>
        </header>
        {saveError && (
          <div className="error-banner" role="alert">
            {saveError}
            <Link to="/app/settings">导出备份</Link>
          </div>
        )}
        <main className="workspace-main">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>BlueMark 工作台</span>
          <span>
            <CircleHelp size={13} />
            数据仅存于当前浏览器
          </span>
        </footer>
      </div>
      <Toast />
    </div>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("BlueMark render error", error, info);
  }
  render() {
    return this.state.error ? (
      <div className="fatal-error">
        <h1>页面暂时无法打开</h1>
        <p>浏览器中的原始项目数据未被清除。</p>
        <button
          className="button button-primary"
          onClick={() => window.location.reload()}
        >
          重新加载
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/landing" element={<Landing />} />
        <Route path="/app" element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/new" element={<BriefWizard />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="content" element={<ContentPage />} />
          <Route path="cases" element={<CasesPage />} />
          <Route path="cases/:id" element={<ProjectDetail caseView />} />
          <Route path="usage" element={<UsagePage />} />
          <Route path="model-config" element={<ModelConfigPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}
function NotFound() {
  return (
    <div className="empty-state">
      <h1>页面不存在</h1>
      <Link className="button button-primary" to="/app">
        返回工作台
      </Link>
    </div>
  );
}
