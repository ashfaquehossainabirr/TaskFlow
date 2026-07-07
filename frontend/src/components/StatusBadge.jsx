import { STATUS_LABELS } from '../utils/deadline';

const DOT_COLOR = {
  todo: 'var(--status-todo)',
  'in-progress': 'var(--status-progress)',
  delivered: 'var(--status-delivered)',
  cancelled: 'var(--status-cancelled)',
  hold: 'var(--status-hold)',
};

export default function StatusBadge({ status }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px 4px 8px',
        borderRadius: 999,
        background: 'var(--bg-inset)',
        border: '1px solid var(--border-hairline)',
        fontSize: 12,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: DOT_COLOR[status] || 'var(--status-todo)',
          boxShadow: `0 0 8px ${DOT_COLOR[status] || 'var(--status-todo)'}`,
        }}
      />
      {STATUS_LABELS[status] || status}
    </span>
  );
}
