import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { z } from "zod";
import {
  Check,
  CheckCheck,
  Copy,
  Download,
  Eraser,
  FileText,
  KeyRound,
  Pencil,
  RefreshCw,
  RotateCcw,
  Save,
  Server,
  ShieldCheck,
  Trash2,
  Unplug,
  X,
} from "lucide-react";
import {
  defaultConfig,
  emptyBrief,
  formatTime,
  PLATFORMS,
  STEP_LABELS,
} from "../domain";
import type {
  ContentItem,
  ModelConfig,
  ReviewStatus,
  Settings,
} from "../domain";
import { useApp } from "../store";
import { downloadFile, escapeHtml } from "../export";
import { testConnection } from "../engine";
import {
  Badge,
  Busy,
  copyText,
  Empty,
  Modal,
  PageHeader,
  SearchInput,
  Status,
} from "../components/ui";
import { PlatformLogo } from "../components/PlatformLogo";
import { SelectField } from "../components/SelectField";
import "./operations.css";

const REVIEWS: ReviewStatus[] = ["待审核", "已审核", "需要修改"];
const contentKey = (item: ContentItem) => `${item.projectId}:${item.id}`;
const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "操作失败，请重试";
const CONTENT_DRAFT_PREFIX = "bluemark.content-draft.v1:";
const scheduleLabel = (value: string) => {
  if (!value) return "未排期";
  return /^\d{4}-\d{2}-\d{2}T/.test(value) ? formatTime(value) : value;
};
const contentDraftSchema = z.object({
  version: z.literal(1),
  sourceUpdatedAt: z.string(),
  savedAt: z.string(),
  fields: z.object({
    title: z.string(),
    body: z.string(),
    platform: z.enum(["小红书", "抖音", "微信公众号", "视频号", "微博"]),
    type: z.string(),
    goal: z.string(),
    publishAt: z.string(),
    owner: z.string(),
    needsEdit: z.boolean(),
  }),
});
function editableFields(item: ContentItem) {
  return {
    title: item.title,
    body: item.body,
    platform: item.platform,
    type: item.type,
    goal: item.goal,
    publishAt: item.publishAt,
    owner: item.owner,
    needsEdit: item.needsEdit,
  };
}
function readContentDraft(key: string) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? contentDraftSchema.parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`op-notice${error ? " op-notice-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      {children}
    </div>
  );
}

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="op-filter">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ContentEditor({
  item,
  onClose,
}: {
  item: ContentItem;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState({
    ...item,
    review: "待审核" as ReviewStatus,
  });
  const [error, setError] = useState("");
  const [draftTime, setDraftTime] = useState("");
  const autoSave = useApp((s) => s.settings.autoSave);
  const draftKey = `${CONTENT_DRAFT_PREFIX}${contentKey(item)}`;
  const [recovery, setRecovery] = useState(() => readContentDraft(draftKey));
  const updateContent = useApp((s) => s.updateContent);
  const dirty =
    JSON.stringify(editableFields(draft)) !==
    JSON.stringify(editableFields(item));
  const persistDraft = useCallback(() => {
    const savedAt = new Date().toISOString();
    const secret = useApp.getState().config.apiKey;
    const text = JSON.stringify(
      {
        version: 1,
        sourceUpdatedAt: item.updatedAt,
        savedAt,
        fields: editableFields(draft),
      },
      (_key, value) =>
        typeof value === "string" && secret
          ? value.split(secret).join("[REDACTED]")
          : value,
    );
    localStorage.setItem(draftKey, text);
    setDraftTime(savedAt);
  }, [draft, draftKey, item.updatedAt]);
  useEffect(() => {
    if (!autoSave || recovery || !dirty) return;
    try {
      persistDraft();
    } catch {
      setError("草稿暂存失败，请手动保存或导出内容。");
    }
  }, [autoSave, dirty, persistDraft, recovery]);
  function removeDraft() {
    localStorage.removeItem(draftKey);
    setDraftTime("");
  }
  const closeState = useRef({
    autoSave,
    dirty,
    recovery,
    persistDraft,
    onClose,
  });
  closeState.current = { autoSave, dirty, recovery, persistDraft, onClose };
  const closeEditor = useCallback(() => {
    const { autoSave, dirty, recovery, persistDraft, onClose } =
      closeState.current;
    if (autoSave && dirty && !recovery) {
      try {
        persistDraft();
        useApp.getState().notify("草稿已暂存，正式内容未修改");
      } catch {
        setError("草稿暂存失败，请保存内容或明确放弃修改。");
        return;
      }
    }
    onClose();
  }, []);
  function discard() {
    try {
      removeDraft();
      onClose();
    } catch {
      setError("无法删除本地草稿，请检查浏览器存储权限。");
    }
  }
  const set = <K extends keyof ContentItem>(key: K, value: ContentItem[K]) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
      review: current.review === "已审核" ? "待审核" : current.review,
    }));
  };
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!draft.title.trim() || !draft.body.trim()) {
      setError("请填写内容标题和正文。");
      return;
    }
    const project = useApp
      .getState()
      .projects.find((p) => p.id === item.projectId);
    if (!project?.solution.contents?.some((c) => c.id === item.id)) {
      setError("内容已不存在，请关闭后刷新列表。");
      return;
    }
    if (project.steps.some((s) => s.status === "running")) {
      setError("项目正在生成，请完成后再保存。");
      return;
    }
    if (
      project.solution.contents.find((c) => c.id === item.id)?.updatedAt !==
      item.updatedAt
    ) {
      setError("内容已被更新，请关闭并重新打开，避免覆盖新版本。");
      return;
    }
    const saved = updateContent(
      item.projectId,
      item.id,
      {
        title: draft.title.trim(),
        body: draft.body.trim(),
        platform: draft.platform,
        type: draft.type.trim(),
        goal: draft.goal.trim(),
        publishAt: draft.publishAt.trim(),
        owner: draft.owner.trim(),
        review: "待审核",
        needsEdit: draft.needsEdit,
      },
      item.updatedAt,
    );
    if (!saved) return;
    try {
      removeDraft();
    } catch {
      useApp.getState().notify("内容已保存，但暂存草稿未能清除");
      onClose();
      return;
    }
    useApp.getState().notify("内容已保存，待重新审核");
    onClose();
  }
  return (
    <Modal title="编辑内容" onClose={closeEditor} wide>
      <form className="op-modal-form" onSubmit={submit}>
        {recovery && (
          <div className="op-recovery">
            <span>
              发现未提交草稿 · {formatTime(recovery.savedAt)}
              {recovery.sourceUpdatedAt !== item.updatedAt && (
                <span className="op-cell-detail">
                  正式内容已更新，请核对后再保存。
                </span>
              )}
            </span>
            <div className="op-inline-actions">
              <button
                type="button"
                className="button button-secondary"
                title="恢复暂存内容，不提交正式内容"
                onClick={() => {
                  setDraft({ ...item, ...recovery.fields, review: "待审核" });
                  setRecovery(null);
                }}
              >
                <RotateCcw size={15} />
                恢复草稿
              </button>
              <button
                type="button"
                className="icon-button"
                title="丢弃暂存草稿"
                aria-label="丢弃暂存草稿"
                onClick={() => {
                  try {
                    removeDraft();
                    setRecovery(null);
                  } catch {
                    setError("无法删除本地草稿。");
                  }
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )}
        <label className="field">
          内容标题
          <input
            required
            maxLength={300}
            value={draft.title}
            onChange={(e) => set("title", e.target.value)}
          />
        </label>
        <div className="form-grid op-form-grid">
          <label className="field">
            平台
            <SelectField
              ariaLabel="平台"
              value={draft.platform}
              onChange={(value) => set("platform", value as ContentItem["platform"])}
              options={PLATFORMS.map((value) => ({ value, label: value }))}
            />
          </label>
          <label className="field">
            内容类型
            <input
              value={draft.type}
              onChange={(e) => set("type", e.target.value)}
            />
          </label>
        </div>
        <label className="field">
          正文 / 脚本
          <textarea
            className="op-body-editor"
            required
            rows={12}
            value={draft.body}
            onChange={(e) => set("body", e.target.value)}
          />
        </label>
        <div className="form-grid op-form-grid">
          <label className="field">
            内容目标
            <input
              value={draft.goal}
              onChange={(e) => set("goal", e.target.value)}
            />
          </label>
          <label className="field">
            建议发布时间
            <input
              placeholder="例如：第 1 周 周三 18:00"
              value={draft.publishAt}
              onChange={(e) => set("publishAt", e.target.value)}
            />
          </label>
          <label className="field">
            负责人
            <input
              value={draft.owner}
              onChange={(e) => set("owner", e.target.value)}
            />
          </label>
          <div className="field">
            <span>保存后状态</span>
            <div>
              <Status value="待审核" />
            </div>
          </div>
        </div>
        <label className="op-check">
          <input
            type="checkbox"
            checked={draft.needsEdit}
            onChange={(e) =>
              setDraft((current) => ({
                ...current,
                needsEdit: e.target.checked,
                review: e.target.checked ? "需要修改" : "待审核",
              }))
            }
          />
          需要人工修改
        </label>
        {error && <Notice error>{error}</Notice>}
        <div className="op-modal-footer">
          {draftTime && (
            <span className="op-draft-status" role="status">
              草稿暂存于 {formatTime(draftTime)}
            </span>
          )}
          <button
            type="button"
            className="button button-secondary"
            onClick={discard}
            title="取消编辑并丢弃本地草稿"
          >
            <X size={16} />
            放弃修改
          </button>
          <button
            className="button button-primary"
            disabled={!!recovery}
            title="保存内容并重置为待审核"
          >
            <Save size={16} />
            保存内容
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ContentPage() {
  const projects = useApp((s) => s.projects);
  const updateContent = useApp((s) => s.updateContent);
  const regenerateContent = useApp((s) => s.regenerateContent);
  const exportFormat = useApp((s) => s.settings.exportFormat);
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState("");
  const [projectId, setProjectId] = useState("");
  const [review, setReview] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [pending, setPending] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const selectAllRef = useRef<HTMLInputElement>(null);
  const activeProjects = useRef(new Set<string>());
  const rows = useMemo(
    () =>
      projects.flatMap((project) =>
        (project.solution.contents || []).map((item) => ({ item, project })),
      ),
    [projects],
  );
  const visible = rows.filter(({ item, project }) => {
    const query = search.trim().toLocaleLowerCase();
    return (
      (!query ||
        `${item.title} ${item.body} ${project.brief.name} ${item.owner}`
          .toLocaleLowerCase()
          .includes(query)) &&
      (!platform || item.platform === platform) &&
      (!projectId || project.id === projectId) &&
      (!review || item.review === review)
    );
  });
  const chosen = rows.filter(({ item }) => selected.has(contentKey(item)));
  const visibleSelected = visible.filter(({ item }) =>
    selected.has(contentKey(item)),
  ).length;
  const allSelected = visible.length > 0 && visibleSelected === visible.length;
  const hasFilters = !!(search || platform || projectId || review);
  const projectBusy = (id: string) =>
    !!pending[id] ||
    projects
      .find((p) => p.id === id)
      ?.steps.some((s) => s.status === "running");
  useEffect(() => {
    if (selectAllRef.current)
      selectAllRef.current.indeterminate = visibleSelected > 0 && !allSelected;
  }, [visibleSelected, allSelected]);
  function toggle(key: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function toggleAll() {
    setSelected((current) => {
      const next = new Set(current);
      visible.forEach(({ item }) => {
        if (allSelected) next.delete(contentKey(item));
        else next.add(contentKey(item));
      });
      return next;
    });
  }
  function bulkReview() {
    if (!chosen.length || chosen.some(({ project }) => projectBusy(project.id)))
      return;
    chosen.forEach(({ item }) =>
      updateContent(item.projectId, item.id, {
        review: "已审核",
        needsEdit: false,
      }),
    );
    useApp.getState().notify(`已审核 ${chosen.length} 条内容`);
    setSelected(new Set());
  }
  function exportSelected() {
    if (!chosen.length) return;
    const data = chosen.map(({ item, project }) => ({
      ...item,
      projectName: project.brief.name,
      isExample: project.isExample,
    }));
    const markdown = `# BlueMark 内容导出\n\n> 仅导出内容，不执行发布。示例内容不代表真实投放结果。\n\n${data.map((item) => `## ${item.title}\n\n项目：${item.projectName}${item.isExample ? "（内置示例）" : ""}\n平台：${item.platform}\n类型：${item.type}\n目标：${item.goal}\n建议发布时间：${item.publishAt}\n负责人：${item.owner}\n审核：${item.review}\n需要修改：${item.needsEdit ? "是" : "否"}\n\n${item.body}`).join("\n\n---\n\n")}`;
    if (exportFormat === "json")
      downloadFile(
        "BlueMark-选中内容.json",
        JSON.stringify(
          { exportedAt: new Date().toISOString(), contents: data },
          null,
          2,
        ),
      );
    else if (exportFormat === "html")
      downloadFile(
        "BlueMark-选中内容.html",
        `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BlueMark 内容导出</title><style>body{font:15px/1.8 system-ui;max-width:900px;margin:32px auto;padding:0 20px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:inherit}</style><body><pre>${escapeHtml(markdown)}</pre></body></html>`,
        "text/html;charset=utf-8",
      );
    else
      downloadFile(
        "BlueMark-选中内容.md",
        markdown,
        "text/markdown;charset=utf-8",
      );
    new Set(chosen.map(({ project }) => project.id)).forEach((id) =>
      useApp
        .getState()
        .addLog(
          id,
          "导出内容",
          `已导出 ${chosen.filter(({ project }) => project.id === id).length} 条内容（${exportFormat}）`,
        ),
    );
    useApp.getState().notify(`已导出 ${chosen.length} 条内容`);
  }
  async function regenerate(item: ContentItem) {
    if (
      activeProjects.current.has(item.projectId) ||
      projectBusy(item.projectId)
    )
      return;
    activeProjects.current.add(item.projectId);
    const key = contentKey(item);
    setPending((current) => ({ ...current, [item.projectId]: key }));
    setErrors((current) => ({ ...current, [key]: "" }));
    try {
      await regenerateContent(item.projectId, item.id);
      useApp.getState().notify("内容已重新生成，请重新审核");
    } catch (error) {
      setErrors((current) => ({ ...current, [key]: errorMessage(error) }));
    } finally {
      activeProjects.current.delete(item.projectId);
      setPending((current) => ({ ...current, [item.projectId]: "" }));
    }
  }
  return (
    <div className="op-page">
      <PageHeader
        title="内容管理"
        hideTitle
        actions={
          <span className="op-total">
            <FileText size={16} />
            {rows.length} 条内容
          </span>
        }
      />
      <section className="section op-section">
        <div className="toolbar op-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="搜索标题、正文、项目或负责人"
          />
          <Filter label="平台">
            <SelectField
              ariaLabel="平台筛选"
              value={platform}
              onChange={setPlatform}
              options={[
                { value: "", label: "全部平台" },
                ...PLATFORMS.map((value) => ({ value, label: value })),
              ]}
            />
          </Filter>
          <Filter label="项目">
            <SelectField
              ariaLabel="项目筛选"
              value={projectId}
              onChange={setProjectId}
              options={[
                { value: "", label: "全部项目" },
                ...projects.map((project) => ({ value: project.id, label: project.brief.name })),
              ]}
            />
          </Filter>
          <Filter label="审核">
            <SelectField
              ariaLabel="审核筛选"
              value={review}
              onChange={setReview}
              options={[
                { value: "", label: "全部状态" },
                ...REVIEWS.map((value) => ({ value, label: value })),
              ]}
            />
          </Filter>
          {hasFilters && (
            <button
              className="icon-button"
              title="重置筛选"
              aria-label="重置筛选"
              onClick={() => {
                setSearch("");
                setPlatform("");
                setProjectId("");
                setReview("");
              }}
            >
              <RotateCcw size={17} />
            </button>
          )}
        </div>
        <div className="op-selection-bar">
          <span>
            已选 <strong>{chosen.length}</strong> 条
            <span className="muted"> · 筛选结果 {visible.length} 条</span>
          </span>
          <div className="op-inline-actions">
            <button
              className="button button-secondary"
              title="将选中内容标记为已审核"
              disabled={
                !chosen.length ||
                chosen.some(({ project }) => projectBusy(project.id))
              }
              onClick={bulkReview}
            >
              <CheckCheck size={16} />
              批量审核
            </button>
            <button
              className="button button-secondary"
              title={`导出选中内容（${exportFormat}）`}
              disabled={!chosen.length}
              onClick={exportSelected}
            >
              <Download size={16} />
              导出选中
            </button>
            {chosen.length > 0 && (
              <button
                className="icon-button"
                title="取消全部选择"
                aria-label="取消全部选择"
                onClick={() => setSelected(new Set())}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
        {visible.length ? (
          <div className="table-wrap op-table-wrap">
            <table className="data-table op-content-table">
              <thead>
                <tr>
                  <th className="op-checkbox-cell">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      aria-label="选择当前筛选的全部内容"
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>内容</th>
                  <th>所属项目</th>
                  <th>平台</th>
                  <th>审核</th>
                  <th>负责人 / 排期</th>
                  <th className="op-actions-cell">操作</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(({ item, project }) => (
                  <tr
                    key={contentKey(item)}
                    className={
                      selected.has(contentKey(item)) ? "op-row-selected" : ""
                    }
                  >
                    <td className="op-checkbox-cell">
                      <input
                        type="checkbox"
                        aria-label={`选择 ${item.title}`}
                        checked={selected.has(contentKey(item))}
                        onChange={() => toggle(contentKey(item))}
                      />
                    </td>
                    <td>
                      <button
                        className="op-title-button"
                        title={`编辑 ${item.title}`}
                        disabled={projectBusy(project.id)}
                        onClick={() => setEditing(item)}
                      >
                        {item.title}
                      </button>
                      {errors[contentKey(item)] && (
                        <div className="op-row-error" role="alert">
                          {errors[contentKey(item)]}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="op-project-name">
                        {project.brief.name}
                      </span>
                      {project.isExample && <Badge>内置示例</Badge>}
                    </td>
                    <td>
                      <span className="op-platform-cell">
                        <PlatformLogo platform={item.platform} />
                      </span>
                    </td>
                    <td>
                      {pending[project.id] === contentKey(item) ? (
                        <Busy label="重新生成中" />
                      ) : (
                        <Status value={item.review} />
                      )}
                    </td>
                    <td>
                      <span>{item.owner || "未分配"}</span>
                      <span className="op-cell-detail">
                        {scheduleLabel(item.publishAt)}
                      </span>
                    </td>
                    <td>
                      <div className="op-row-actions">
                        <button
                          className="icon-button"
                          title="编辑内容"
                          aria-label={`编辑 ${item.title}`}
                          disabled={projectBusy(project.id)}
                          onClick={() => setEditing(item)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button"
                          title="复制标题与正文"
                          aria-label={`复制 ${item.title}`}
                          onClick={() =>
                            void copyText(`${item.title}\n\n${item.body}`)
                          }
                        >
                          <Copy size={16} />
                        </button>
                        <button
                          className="icon-button"
                          title="重新生成内容（会覆盖当前内容）"
                          aria-label={`重新生成 ${item.title}`}
                          disabled={projectBusy(project.id)}
                          onClick={() => void regenerate(item)}
                        >
                          <RefreshCw
                            size={16}
                            className={
                              pending[project.id] === contentKey(item)
                                ? "spin"
                                : undefined
                            }
                          />
                        </button>
                        <button
                          className="icon-button"
                          title="标记需要修改"
                          aria-label={`标记需要修改 ${item.title}`}
                          disabled={
                            projectBusy(project.id) ||
                            (item.review === "需要修改" && item.needsEdit)
                          }
                          onClick={() =>
                            updateContent(item.projectId, item.id, {
                              review: "需要修改",
                              needsEdit: true,
                            })
                          }
                        >
                          <Eraser size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={rows.length ? "没有符合筛选条件的内容" : "暂无内容"} />
        )}
        <div className="op-table-footer">
          <span>共 {visible.length} 条</span>
          <span>
            <ShieldCheck size={14} />
            内容仅供审核与导出，不会自动发布
          </span>
        </div>
      </section>
      {editing && (
        <ContentEditor item={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

export function UsagePage() {
  const logs = useApp((s) => s.logs);
  const [project, setProject] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const projects = useMemo(
    () => [
      ...new Map(logs.map((log) => [log.projectId, log.projectName])).entries(),
    ],
    [logs],
  );
  const actions = useMemo(
    () => [
      ...new Set([
        ...logs.map((log) => log.action),
        ...Object.values(STEP_LABELS),
      ]),
    ],
    [logs],
  );
  const invalidDates = !!(from && to && from > to);
  const filtered = logs
    .filter((log) => {
      const date = new Date(log.time);
      const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return (
        !invalidDates &&
        (!project || log.projectId === project) &&
        (!action || log.action === action) &&
        (!from || localDate >= from) &&
        (!to || localDate <= to)
      );
    })
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  return (
    <div className="op-page">
      <PageHeader
        title="使用记录"
        hideTitle
        actions={
          <span className="op-total">
            {logs.filter((l) => !l.isExample).length} 条实际操作
            <Badge>示例 {logs.filter((l) => l.isExample).length}</Badge>
          </span>
        }
      />
      <section className="section op-section">
        <div className="toolbar op-toolbar">
          <Filter label="项目">
            <SelectField
              ariaLabel="项目筛选"
              value={project}
              onChange={setProject}
              options={[
                { value: "", label: "全部项目" },
                ...projects.map(([id, name]) => ({ value: id, label: name })),
              ]}
            />
          </Filter>
          <Filter label="操作">
            <SelectField
              ariaLabel="操作筛选"
              value={action}
              onChange={setAction}
              options={[
                { value: "", label: "全部操作" },
                ...actions.map((value) => ({ value, label: value })),
              ]}
            />
          </Filter>
          <Filter label="开始日期">
            <input
              type="date"
              aria-label="开始日期"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Filter>
          <Filter label="结束日期">
            <input
              type="date"
              aria-label="结束日期"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
            />
          </Filter>
          {(project || action || from || to) && (
            <button
              className="icon-button"
              title="重置筛选"
              aria-label="重置筛选"
              onClick={() => {
                setProject("");
                setAction("");
                setFrom("");
                setTo("");
              }}
            >
              <RotateCcw size={17} />
            </button>
          )}
        </div>
        {invalidDates && <Notice error>开始日期不能晚于结束日期。</Notice>}
        {filtered.length ? (
          <div className="table-wrap op-table-wrap">
            <table className="data-table op-usage-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>项目</th>
                  <th>操作</th>
                  <th>操作人</th>
                  <th>模型</th>
                  <th>结果</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <time
                        dateTime={log.time}
                        title={new Date(log.time).toLocaleString("zh-CN")}
                      >
                        {formatTime(log.time)}
                      </time>
                      {log.isExample && (
                        <div className="op-example-badge">
                          <Badge tone="orange">示例记录</Badge>
                        </div>
                      )}
                    </td>
                    <td className="op-log-project">{log.projectName}</td>
                    <td>{log.action}</td>
                    <td>{log.actor}</td>
                    <td className="op-model-cell">{log.model}</td>
                    <td>
                      <Badge tone={log.success ? "green" : "red"}>
                        {log.success ? "成功" : "失败"}
                      </Badge>
                      <div className="op-log-result">{log.result}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={logs.length ? "没有符合筛选条件的记录" : "暂无操作记录"}
          />
        )}
        <div className="op-table-footer">
          <span>共 {filtered.length} 条</span>
          <span>
            实际操作 {filtered.filter((l) => !l.isExample).length} 条 · 示例{" "}
            {filtered.filter((l) => l.isExample).length} 条
          </span>
        </div>
      </section>
    </div>
  );
}

const PROVIDERS = [
  {
    id: "deepseek",
    name: "DeepSeek",
    url: "https://api.deepseek.com/v1",
    model: "deepseek-chat",
  },
  {
    id: "openai",
    name: "OpenAI",
    url: "https://api.openai.com/v1",
    model: "gpt-4o-mini",
  },
  {
    id: "qwen",
    name: "阿里云百炼",
    url: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    model: "qwen-plus",
  },
  { id: "custom", name: "自定义 / OpenAI Compatible", url: "", model: "" },
];
function validateConfig(config: ModelConfig) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/@-]{0,127}$/.test(config.model.trim()))
    return "请输入有效的模型名称，使用不超过 128 位的字母、数字或 . _ : / @ -。";
  try {
    const url = new URL(config.baseUrl);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      return "API 地址须为不含凭证、查询参数和锚点的 HTTP 或 HTTPS 地址。";
  } catch {
    return "请输入完整的 API 地址。";
  }
  if (config.apiKey.length > 4096 || /[\r\n\x00]/.test(config.apiKey))
    return "API Key 格式无效，请移除换行或控制字符。";
  if (
    !Number.isFinite(config.temperature) ||
    config.temperature < 0 ||
    config.temperature > 2
  )
    return "Temperature 应在 0–2 之间。";
  if (
    !Number.isInteger(config.maxTokens) ||
    config.maxTokens < 1 ||
    config.maxTokens > 16384
  )
    return "最大输出 Token 应为 1–16384 的整数。";
  if (
    !Number.isInteger(config.timeout) ||
    config.timeout < 1 ||
    config.timeout > 180
  )
    return "超时时间应为 1–180 秒的整数。";
  return "";
}

export function ModelConfigPage() {
  const config = useApp((s) => s.config);
  const updateConfig = useApp((s) => s.updateConfig);
  const [draft, setDraft] = useState<ModelConfig>({ ...config });
  const [provider, setProvider] = useState(
    PROVIDERS.find((p) => p.url === config.baseUrl)?.id || "custom",
  );
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [serverStatus, setServerStatus] = useState<
    "unknown" | "configured" | "empty" | "error"
  >("unknown");
  const [serverError, setServerError] = useState("");
  const testVersion = useRef(0);
  const testing = useRef(false);
  const preserveDraft = useRef(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(config);
  useEffect(() => {
    if (preserveDraft.current) {
      preserveDraft.current = false;
      return;
    }
    setDraft({ ...config });
    setProvider(
      PROVIDERS.find((p) => p.url === config.baseUrl)?.id || "custom",
    );
  }, [config]);
  useEffect(
    () => () => {
      testVersion.current++;
    },
    [],
  );
  function change<K extends keyof ModelConfig>(key: K, value: ModelConfig[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
      connection: "untested",
      lastTestAt: "",
      error: "",
    }));
    setError("");
  }
  function normalized() {
    return {
      ...draft,
      baseUrl: draft.baseUrl.trim().replace(/\/+$/, ""),
      model: draft.model.trim(),
      apiKey: draft.apiKey.trim(),
    };
  }
  function save(event: FormEvent) {
    event.preventDefault();
    const next = normalized();
    const problem = validateConfig(next);
    if (problem) {
      setError(problem);
      return;
    }
    updateConfig(next);
    useApp
      .getState()
      .addLog(
        "",
        "保存模型配置",
        `${next.mock ? "Mock" : next.model} 配置已保存；未发起模型调用`,
      );
    useApp.getState().notify("模型配置已保存");
  }
  async function test() {
    if (testing.current) return;
    const snapshot = normalized();
    const problem = validateConfig(snapshot);
    if (problem) {
      setError(problem);
      return;
    }
    testing.current = true;
    const version = ++testVersion.current;
    setPending(true);
    setError("");
    updateConfig({
      ...snapshot,
      connection: "untested",
      error: "",
      lastTestAt: "",
    });
    try {
      const result = await testConnection(snapshot);
      if (version !== testVersion.current) return;
      updateConfig({
        model: result.model,
        connection: "success",
        lastTestAt: new Date().toISOString(),
        error: "",
      });
      useApp
        .getState()
        .addLog(
          "",
          "测试模型连接",
          result.mode === "mock"
            ? `Mock 测试通过（${result.model}），未调用真实模型`
            : `${result.model} 连接测试通过`,
        );
      const logId = useApp.getState().logs[0]?.id;
      useApp.setState((state) => ({
        logs: state.logs.map((log) =>
          log.id === logId ? { ...log, model: result.model } : log,
        ),
      }));
      useApp
        .getState()
        .notify(snapshot.mock ? "Mock 测试通过" : "模型连接测试通过");
    } catch (cause) {
      if (version !== testVersion.current) return;
      const message = errorMessage(cause);
      updateConfig({
        connection: "error",
        lastTestAt: new Date().toISOString(),
        error: message,
      });
      setError(message);
      useApp.getState().addLog("", "测试模型连接", message, false);
    } finally {
      testing.current = false;
      if (version === testVersion.current) setPending(false);
    }
  }
  async function checkServer() {
    setChecking(true);
    setServerError("");
    try {
      const response = await fetch("/api/status", {
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok)
        throw new Error(`服务状态检查失败（${response.status}）`);
      const result: unknown = await response.json();
      if (
        !result ||
        typeof result !== "object" ||
        !("configured" in result) ||
        typeof result.configured !== "boolean"
      )
        throw new Error("服务未返回可识别的配置状态");
      setServerStatus(result.configured ? "configured" : "empty");
    } catch (cause) {
      setServerStatus("error");
      setServerError(errorMessage(cause));
    } finally {
      setChecking(false);
    }
  }
  function clearKey() {
    preserveDraft.current = true;
    setDraft((current) => ({
      ...current,
      apiKey: "",
      connection: "untested",
      lastTestAt: "",
      error: "",
    }));
    updateConfig({
      apiKey: "",
      connection: "untested",
      lastTestAt: "",
      error: "",
    });
    useApp.getState().notify("本次会话 Key 已清除");
  }
  function reset() {
    updateConfig({ ...defaultConfig });
    setError("");
    setServerStatus("unknown");
    useApp
      .getState()
      .addLog(
        "",
        "重置模型配置",
        "已恢复默认配置，Mock 已开启，会话 Key 已清除",
      );
    useApp.getState().notify("已恢复默认模型配置");
  }
  return (
    <div className="op-page">
      <PageHeader
        title="模型配置"
        hideTitle
        actions={
          <Badge tone={draft.mock ? "orange" : "blue"}>
            {draft.mock ? "Mock 模式" : "真实模型"}
          </Badge>
        }
      />
      <form className="op-settings-form" onSubmit={save}>
        <section className="section op-form-section">
          <div className="section-head op-section-head">
            <h2>连接配置</h2>
            <Badge
              tone={
                draft.connection === "success"
                  ? "green"
                  : draft.connection === "error"
                    ? "red"
                    : "neutral"
              }
            >
              {pending
                ? "测试中"
                : draft.connection === "untested"
                  ? "未测试"
                  : draft.connection === "success"
                    ? draft.mock
                      ? "Mock 测试通过"
                      : "连接成功"
                    : "连接失败"}
            </Badge>
          </div>
          <fieldset className="op-fieldset" disabled={pending}>
            <div className="form-grid op-form-grid">
              <label className="field">
                服务商预设
                <SelectField
                  ariaLabel="服务商预设"
                  value={provider}
                  onChange={(value) => {
                    const preset = PROVIDERS.find((item) => item.id === value)!;
                    setProvider(preset.id);
                    setDraft((current) => ({
                      ...current,
                      provider: preset.name,
                      baseUrl: preset.url || current.baseUrl,
                      model: preset.model || current.model,
                      apiKey: "",
                      connection: "untested",
                      lastTestAt: "",
                      error: "",
                    }));
                    setError("");
                  }}
                  options={PROVIDERS.map((item) => ({ value: item.id, label: item.name }))}
                />
              </label>
              <label className="field">
                模型名称
                <input
                  required
                  autoComplete="off"
                  value={draft.model}
                  onChange={(e) => change("model", e.target.value)}
                />
              </label>
              <label className="field op-full-width">
                API Base URL
                <input
                  type="url"
                  required
                  autoComplete="url"
                  value={draft.baseUrl}
                  onChange={(e) => {
                    setProvider("custom");
                    setDraft((current) => ({
                      ...current,
                      baseUrl: e.target.value,
                      provider: "OpenAI Compatible",
                      connection: "untested",
                      lastTestAt: "",
                      error: "",
                    }));
                    setError("");
                  }}
                />
              </label>
              <div className="field op-full-width">
                <label htmlFor="op-api-key">API Key</label>
                <div className="op-input-action">
                  <input
                    id="op-api-key"
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    value={draft.apiKey}
                    placeholder="留空时使用服务器环境变量"
                    onChange={(e) => change("apiKey", e.target.value)}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    title="清除本次会话 Key"
                    aria-label="清除本次会话 Key"
                    disabled={!draft.apiKey && !config.apiKey}
                    onClick={clearKey}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <span className="op-security-note">
                  <KeyRound size={14} />
                  Key 仅保留在本次页面会话；推荐通过服务器环境变量配置
                </span>
              </div>
            </div>
          </fieldset>
          <div className="op-server-status">
            <span>
              <Server size={16} />
              服务器配置{" "}
              <Badge
                tone={
                  serverStatus === "configured"
                    ? "green"
                    : serverStatus === "error"
                      ? "red"
                      : "neutral"
                }
              >
                {serverStatus === "unknown"
                  ? "尚未检查"
                  : serverStatus === "configured"
                    ? "已配置"
                    : serverStatus === "empty"
                      ? "未配置"
                      : "检查失败"}
              </Badge>
            </span>
            <button
              type="button"
              className="button button-secondary"
              disabled={checking}
              onClick={() => void checkServer()}
              title="检查服务器环境变量配置，不调用模型"
            >
              {checking ? (
                <Busy label="检查中" />
              ) : (
                <>
                  <RefreshCw size={15} />
                  检查服务配置
                </>
              )}
            </button>
          </div>
          {serverError && <Notice error>{serverError}</Notice>}
        </section>
        <section className="section op-form-section">
          <div className="section-head op-section-head">
            <h2>生成参数</h2>
          </div>
          <fieldset className="op-fieldset" disabled={pending}>
            <div className="form-grid op-parameters-grid">
              <label className="field">
                Temperature
                <input
                  type="number"
                  required
                  min={0}
                  max={2}
                  step={0.1}
                  value={
                    Number.isNaN(draft.temperature) ? "" : draft.temperature
                  }
                  onChange={(e) =>
                    change("temperature", e.target.valueAsNumber)
                  }
                />
              </label>
              <label className="field">
                最大输出 Token
                <input
                  type="number"
                  required
                  min={1}
                  max={16384}
                  step={1}
                  value={Number.isNaN(draft.maxTokens) ? "" : draft.maxTokens}
                  onChange={(e) => change("maxTokens", e.target.valueAsNumber)}
                />
              </label>
              <label className="field">
                超时时间（秒）
                <input
                  type="number"
                  required
                  min={1}
                  max={180}
                  step={1}
                  value={Number.isNaN(draft.timeout) ? "" : draft.timeout}
                  onChange={(e) => change("timeout", e.target.valueAsNumber)}
                />
              </label>
            </div>
            <div className="op-setting-row">
              <div>
                <label htmlFor="op-mock">Mock 模式</label>
                <p className="op-security-note">
                  {draft.mock
                    ? "当前使用示例模板，不调用真实模型。"
                    : "测试连接与生成会调用所配置的模型，可能产生费用。"}
                </p>
              </div>
              <input
                id="op-mock"
                className="op-switch"
                type="checkbox"
                role="switch"
                checked={draft.mock}
                onChange={(e) => change("mock", e.target.checked)}
              />
            </div>
          </fieldset>
        </section>
        {(error || draft.error) && (
          <Notice error>{error || draft.error}</Notice>
        )}
        <div className="op-save-bar">
          <div className="op-save-status">
            {pending ? (
              <Busy label="正在测试连接" />
            ) : dirty ? (
              <span>有未保存更改</span>
            ) : (
              <span className="muted">
                <Check size={15} />
                配置已保存
              </span>
            )}
            {draft.lastTestAt && (
              <span className="op-cell-detail">
                上次测试：{new Date(draft.lastTestAt).toLocaleString("zh-CN")}
              </span>
            )}
          </div>
          <div className="op-inline-actions">
            <button
              type="button"
              className="icon-button"
              title="恢复默认配置并清除会话 Key"
              aria-label="恢复默认模型配置"
              disabled={pending}
              onClick={reset}
            >
              <RotateCcw size={18} />
            </button>
            <button
              type="button"
              className="button button-secondary"
              disabled={pending}
              title={
                draft.mock
                  ? "测试 Mock 连接，不发起真实模型请求"
                  : "测试连接，将发起一次真实模型请求"
              }
              onClick={() => void test()}
            >
              <Unplug size={16} />
              {pending ? "测试中" : "测试连接"}
            </button>
            <button
              className="button button-primary"
              disabled={pending}
              title="保存模型配置，不调用模型"
            >
              <Save size={16} />
              保存配置
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function SettingsPage() {
  const settings = useApp((s) => s.settings);
  const config = useApp((s) => s.config);
  const projects = useApp((s) => s.projects);
  const logs = useApp((s) => s.logs);
  const [draft, setDraft] = useState<Settings>({ ...settings });
  const [mock, setMock] = useState(config.mock);
  const [confirming, setConfirming] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const generating = projects.some((p) =>
    p.steps.some((s) => s.status === "running"),
  );
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(settings) || mock !== config.mock;
  useEffect(() => {
    setDraft({ ...settings });
  }, [settings]);
  useEffect(() => {
    setMock(config.mock);
  }, [config.mock]);
  function change<K extends keyof Settings>(key: K, value: Settings[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (!draft.defaultModel.trim()) {
      setError("请填写默认模型。");
      return;
    }
    if (
      !/^[a-zA-Z0-9][a-zA-Z0-9._:/@-]{0,127}$/.test(draft.defaultModel.trim())
    ) {
      setError(
        "默认模型名称格式无效，请使用不超过 128 位的字母、数字或 . _ : / @ -。",
      );
      return;
    }
    const store = useApp.getState();
    store.updateSettings({
      ...draft,
      defaultModel: draft.defaultModel.trim(),
      language: "简体中文",
    });
    if (
      mock !== config.mock ||
      draft.defaultModel.trim() !== settings.defaultModel
    )
      store.updateConfig({
        mock,
        ...(draft.defaultModel.trim() !== settings.defaultModel
          ? { model: draft.defaultModel.trim() }
          : {}),
        connection: "untested",
        lastTestAt: "",
        error: "",
      });
    store.addLog("", "保存系统设置", "系统偏好已保存");
    store.notify("设置已保存");
  }
  function exportAll() {
    try {
      const { version, projects, logs, config, settings, draft } =
        useApp.getState();
      const contentDrafts = Object.keys(localStorage)
        .filter((key) => key.startsWith(CONTENT_DRAFT_PREFIX))
        .flatMap((key) => {
          const saved = readContentDraft(key);
          return saved ? [{ key, ...saved }] : [];
        });
      const text = JSON.stringify(
        {
          version,
          exportedAt: new Date().toISOString(),
          projects,
          logs,
          config: { ...config, apiKey: "[REDACTED]", error: "" },
          settings,
          draft,
          contentDrafts,
        },
        (key, value) => {
          if (
            /api[_-]?key|authorization|access[_-]?token|secret|password/i.test(
              key,
            )
          )
            return "[REDACTED]";
          return typeof value === "string" && config.apiKey
            ? value.split(config.apiKey).join("[REDACTED]")
            : value;
        },
        2,
      );
      downloadFile(
        `BlueMark-本地数据备份-${new Date().toISOString().slice(0, 10)}.json`,
        text,
      );
      useApp
        .getState()
        .addLog(
          "",
          "导出全部数据",
          `已导出 ${projects.length} 个项目和 ${logs.length} 条记录，API Key 已脱敏`,
        );
      useApp.getState().notify("全部数据已导出，API Key 已脱敏");
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }
  function clearData() {
    if (confirmation !== "清空") return;
    if (
      useApp
        .getState()
        .projects.some((p) => p.steps.some((s) => s.status === "running"))
    ) {
      setError("项目正在生成，请完成后再清空数据。");
      return;
    }
    try {
      Object.keys(localStorage)
        .filter((key) => key.startsWith(CONTENT_DRAFT_PREFIX))
        .forEach((key) => localStorage.removeItem(key));
    } catch {
      setError("无法清空内容草稿，请检查浏览器存储权限。");
      return;
    }
    const store = useApp.getState();
    store.reset();
    useApp.setState({
      projects: [],
      logs: [],
      draft: structuredClone(emptyBrief),
      config: { ...defaultConfig },
    });
    useApp
      .getState()
      .notify("本地项目、内容、记录与会话 Key 已清空，设置已恢复默认");
    setError("");
    setConfirming(false);
    setConfirmation("");
  }
  const closeConfirmation = useCallback(() => {
    setConfirming(false);
    setConfirmation("");
  }, []);
  return (
    <div className="op-page">
      <PageHeader hideTitle title="设置" />
      <form className="op-settings-form" onSubmit={save}>
        <section className="section op-form-section">
          <div className="section-head op-section-head">
            <h2>系统偏好</h2>
          </div>
          <div className="form-grid op-form-grid">
            <label className="field">
              默认语言
              <SelectField
                ariaLabel="默认语言"
                value="简体中文"
                onChange={() => change("language", "简体中文")}
                options={[{ value: "简体中文", label: "简体中文" }]}
              />
            </label>
            <label className="field">
              默认模型
              <input
                required
                value={draft.defaultModel}
                onChange={(e) => change("defaultModel", e.target.value)}
              />
            </label>
            <label className="field">
              默认导出格式
              <SelectField
                ariaLabel="默认导出格式"
                value={draft.exportFormat}
                onChange={(value) => change("exportFormat", value as Settings["exportFormat"])}
                options={[
                  { value: "markdown", label: "Markdown (.md)" },
                  { value: "json", label: "JSON (.json)" },
                  { value: "html", label: "HTML (.html)" },
                ]}
              />
            </label>
          </div>
          <div className="op-setting-row">
            <label htmlFor="op-autosave">自动暂存编辑草稿</label>
            <input
              id="op-autosave"
              className="op-switch"
              type="checkbox"
              role="switch"
              checked={draft.autoSave}
              onChange={(e) => change("autoSave", e.target.checked)}
            />
          </div>
          <div className="op-setting-row">
            <div>
              <label htmlFor="op-settings-mock">Mock 模式</label>
              <p className="op-security-note">
                {mock
                  ? "示例输出不代表真实市场数据。"
                  : "生成操作会调用已配置模型，可能产生费用。"}
              </p>
            </div>
            <input
              id="op-settings-mock"
              className="op-switch"
              type="checkbox"
              role="switch"
              checked={mock}
              onChange={(e) => setMock(e.target.checked)}
            />
          </div>
        </section>
        {error && <Notice error>{error}</Notice>}
        <div className="op-save-bar">
          <span className="muted">{dirty ? "有未保存更改" : "设置已保存"}</span>
          <button className="button button-primary" title="保存系统设置">
            <Save size={16} />
            保存设置
          </button>
        </div>
      </form>
      <section className="section op-form-section">
        <div className="section-head op-section-head">
          <h2>数据管理</h2>
          <span className="muted">
            {projects.length} 个项目 · {logs.length} 条记录
          </span>
        </div>
        <div className="op-setting-row">
          <div>
            <strong>导出全部数据</strong>
            <p className="op-security-note">
              API Key 已脱敏；备份仍可能包含品牌资料与未发布内容。
            </p>
          </div>
          <button
            className="button button-secondary"
            title="导出脱敏本地数据备份"
            onClick={exportAll}
          >
            <Download size={16} />
            导出数据
          </button>
        </div>
        <div className="op-setting-row">
          <div>
            <strong className="op-danger-text">清空本地数据</strong>
            <p className="op-security-note">
              删除全部本地项目、内容和记录，清除会话 Key
              并恢复默认设置。不可撤销。
            </p>
          </div>
          <button
            className="button button-danger"
            disabled={generating}
            title={
              generating ? "请等待项目生成完成" : "清空本地数据，需二次确认"
            }
            onClick={() => {
              setError("");
              setConfirming(true);
            }}
          >
            <Trash2 size={16} />
            清空数据
          </button>
        </div>
      </section>
      <section className="section op-form-section">
        <div className="section-head op-section-head">
          <h2>权限边界</h2>
          <Badge>本地运行</Badge>
        </div>
        <p className="op-boundary">
          <ShieldCheck size={17} />
          当前数据仅保存在浏览器本地，未接入登录、成员管理或权限隔离。
        </p>
      </section>
      {confirming && (
        <Modal title="清空本地数据" onClose={closeConfirmation}>
          <div className="op-modal-form">
            <Notice error>
              全部本地项目、内容和使用记录将被删除，设置恢复默认。此操作不可撤销。
            </Notice>
            <label className="field">
              输入“清空”确认
              <input
                autoComplete="off"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="清空"
              />
            </label>
            {generating && (
              <Notice error>项目正在生成，请完成后再操作。</Notice>
            )}
            {error && <Notice error>{error}</Notice>}
            <div className="op-modal-footer">
              <button
                className="button button-secondary"
                title="取消清空数据"
                onClick={closeConfirmation}
              >
                <X size={16} />
                取消
              </button>
              <button
                className="button button-danger"
                disabled={confirmation !== "清空" || generating}
                title="确认永久清空本地数据"
                onClick={clearData}
              >
                <Trash2 size={16} />
                确认清空
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
