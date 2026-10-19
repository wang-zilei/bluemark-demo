import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X, Search, Inbox, LoaderCircle } from "lucide-react";
import { useApp } from "../store";
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "blue" | "green" | "orange" | "red";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
export function Status({ value }: { value: string }) {
  return (
    <Badge
      tone={
        ["已完成", "已审核", "成功"].includes(value)
          ? "green"
          : ["待审核", "需要修改"].includes(value)
            ? "orange"
            : value === "生成中"
              ? "blue"
              : "neutral"
      }
    >
      {value}
    </Badge>
  );
}
export function PageHeader({
  title,
  meta,
  actions,
  hideTitle = false,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  hideTitle?: boolean;
}) {
  if (hideTitle && !meta && !actions) return null;
  return (
    <header className={`page-heading ${hideTitle ? "page-heading-compact" : ""}`}>
      {!hideTitle && (
        <div>
          <h1>{title}</h1>
          {meta && <div className="page-meta">{meta}</div>}
        </div>
      )}
      {hideTitle && meta && <div className="page-heading-meta-only">{meta}</div>}
      {actions && <div className="heading-actions">{actions}</div>}
    </header>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Inbox size={32} />
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function SearchInput({
  value,
  onChange,
  placeholder = "搜索",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="search-input">
      <Search size={16} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null),
    closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const old = document.activeElement as HTMLElement;
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
      if (e.key === "Tab") {
        const list = ref.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]',
        );
        if (!list?.length) return;
        const first = list[0],
          last = list[list.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === ref.current)
        ) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      old?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`modal ${wide ? "modal-wide" : ""}`}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} title="关闭">
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Busy({ label = "处理中" }: { label?: string }) {
  return (
    <span className="inline-busy">
      <LoaderCircle size={16} className="spin" />
      {label}
    </span>
  );
}
export function Toast() {
  const message = useApp((s) => s.toast),
    clear = useApp((s) => s.clearToast);
  useEffect(() => {
    if (message) {
      const t = setTimeout(clear, 4200);
      return () => clearTimeout(t);
    }
  }, [message, clear]);
  return message ? (
    <div className="toast" role="status">
      {message}
      <button onClick={clear} title="关闭通知">
        <X size={15} />
      </button>
    </div>
  ) : null;
}
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    useApp.getState().notify("已复制");
  } catch {
    useApp.getState().notify("剪贴板不可用，请通过导出获取内容");
  }
}
