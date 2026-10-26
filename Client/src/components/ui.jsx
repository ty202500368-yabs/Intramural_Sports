import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarX2,
  Inbox,
  RefreshCw,
  X,
} from 'lucide-react';
import { accentFor, FORMATS, STATUS, sportInitials } from '../lib/sports';
import { initials } from '../lib/format';

export function BrandMark({ small = false }) {
  return (
    <span className={`brand-mark${small ? ' brand-mark--sm' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none">
        <path
          d="M9 13l6 15 5-10 5 10 6-15"
          stroke="currentColor"
          strokeWidth="3.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function Avatar({ name, size = 36 }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function StatusBadge({ status, className = '' }) {
  const info = STATUS[status] || { label: status, tone: 'gray' };
  return (
    <span className={`badge badge--${info.tone} ${className}`.trim()}>
      {status === 'ongoing' && <span className="badge__pulse" />}
      {info.label}
    </span>
  );
}

export function FormatBadge({ format }) {
  return (
    <span className="badge badge--neutral">
      {FORMATS[format] || 'Tournament'}
    </span>
  );
}

export function SportMark({ name = '', size = 'md' }) {
  const accent = accentFor(name);
  return (
    <span
      className={`sport-mark sport-mark--${size}`}
      style={{ background: accent.bg, color: accent.fg }}
      aria-hidden="true"
    >
      {sportInitials(name)}
    </span>
  );
}

export function TeamCrest({ name = '', size = 'md' }) {
  const accent = accentFor(name);
  return (
    <span
      className={`team-crest team-crest--${size}`}
      style={{ background: accent.bg, color: accent.fg }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <header className="page-head">
      <div className="page-head__copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {subtitle && <p className="page-head__sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-head__actions">{actions}</div>}
    </header>
  );
}

export function SectionHeader({ title, eyebrow, action, className = '' }) {
  return (
    <div className={`section-head ${className}`.trim()}>
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Spinner({ label = 'Loading' }) {
  return (
    <span className="spinner-wrap">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function LoadingPanel({ label = 'Loading the latest…' }) {
  return (
    <div className="state-panel state-panel--loading">
      <Spinner label={label} />
    </div>
  );
}

export function ErrorPanel({ error, onRetry, title = 'Could not load this page' }) {
  return (
    <div className="state-panel state-panel--error">
      <span className="state-panel__icon">
        <AlertTriangle size={22} />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{error?.message || 'An unexpected error occurred.'}</p>
      </div>
      {onRetry && (
        <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>
          <RefreshCw size={15} /> Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
}) {
  return (
    <div className={`empty-state${compact ? ' empty-state--compact' : ''}`}>
      <span className="empty-state__icon">
        <Icon size={compact ? 20 : 26} strokeWidth={1.7} />
      </span>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

export function NoMatchesState({ title = 'No games here yet', description, action }) {
  return (
    <EmptyState
      icon={CalendarX2}
      title={title}
      description={description}
      action={action}
    />
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'cream', to }) {
  const content = (
    <>
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {Icon && (
          <span className="stat-card__icon">
            <Icon size={17} />
          </span>
        )}
      </div>
      <strong className="stat-card__value">{value}</strong>
      {hint && <span className="stat-card__hint">{hint}</span>}
    </>
  );

  if (to) {
    return (
      <Link className={`stat-card stat-card--${tone}`} to={to}>
        {content}
      </Link>
    );
  }
  return <div className={`stat-card stat-card--${tone}`}>{content}</div>;
}

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  description,
  children,
  footer,
  size = 'md',
  className = '',
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        className={`modal modal--${size} ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
      >
        <header className="modal__head">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2>{title}</h2>
            {description && <p className="modal__desc">{description}</p>}
          </div>
          <button
            type="button"
            className="icon-btn icon-btn--plain"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  tone = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={title}
      size="sm"
      className="confirm-modal"
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="confirm-copy">
        <span className={`confirm-copy__icon confirm-copy__icon--${tone}`}>
          <AlertTriangle size={20} />
        </span>
        <p>{message}</p>
      </div>
    </Modal>
  );
}

export function LinkArrow({ children, ...props }) {
  return (
    <a className="link-arrow" {...props}>
      {children}
      <ArrowRight size={15} />
    </a>
  );
}
