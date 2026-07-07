import { formatDaysRemaining, urgencyLevel } from '../utils/deadline';

const STYLES = {
  overdue: { color: '#ff8a85', bg: 'rgba(239, 100, 97, 0.14)', border: 'rgba(239, 100, 97, 0.4)', pulse: true },
  urgent: { color: '#ffb454', bg: 'rgba(240, 168, 63, 0.14)', border: 'rgba(240, 168, 63, 0.4)', pulse: true },
  soon: { color: '#7ec8ff', bg: 'rgba(74, 158, 255, 0.1)', border: 'rgba(74, 158, 255, 0.3)', pulse: false },
  normal: { color: 'var(--text-secondary)', bg: 'var(--bg-inset)', border: 'var(--border-hairline)', pulse: false },
  closed: { color: 'var(--text-muted)', bg: 'var(--bg-inset)', border: 'var(--border-hairline-soft)', pulse: false },
};

export default function DeadlineChip({ deadline, status }) {
  const level = urgencyLevel(deadline, status);
  const s = STYLES[level];
  const dateLabel = new Date(deadline).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 9px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        position: 'relative',
      }}
      title={`Deadline: ${dateLabel}`}
    >
      {s.pulse && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: s.color,
            animation: 'chipPulse 1.6s ease-in-out infinite',
          }}
        />
      )}
      {status === 'delivered' || status === 'cancelled' ? dateLabel : formatDaysRemaining(deadline)}
      <style>{`
        @keyframes chipPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </span>
  );
}
