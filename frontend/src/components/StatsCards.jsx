const CARDS = [
  { key: 'todo', label: 'To Do', color: 'var(--status-todo)' },
  { key: 'in-progress', label: 'In Progress', color: 'var(--status-progress)' },
  { key: 'hold', label: 'On Hold', color: 'var(--status-hold)' },
  { key: 'delivered', label: 'Delivered', color: 'var(--status-delivered)' },
  { key: 'cancelled', label: 'Cancelled', color: 'var(--status-cancelled)' },
];

export default function StatsCards({ stats, loading, onCardClick }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: 12,
        marginBottom: 28,
      }}
    >
      <style>{`
        .stat-card {
          transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
        }
        .stat-card:hover {
          transform: translateY(-3px);
          background: var(--bg-panel-raised);
          border-color: var(--glow);
          box-shadow: 0 10px 24px -8px var(--glow), 0 0 0 1px var(--glow) inset;
        }
        .stat-card:hover .stat-card-bar {
          width: 5px;
          box-shadow: 0 0 12px var(--glow);
        }
        .stat-card:hover .stat-card-value {
          color: var(--glow);
        }
        @media (prefers-reduced-motion: reduce) {
          .stat-card { transition: none; }
          .stat-card:hover { transform: none; }
        }
      `}</style>
      {CARDS.map((c) => (
        <div
          key={c.key}
          className="stat-card"
          onClick={() => onCardClick && onCardClick(c.key, c.label)}
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-hairline-soft)',
            borderRadius: 'var(--radius-lg)',
            padding: '18px 18px 16px',
            position: 'relative',
            overflow: 'hidden',
            cursor: onCardClick ? 'pointer' : 'default',
            '--glow': c.color,
          }}
        >
          <div
            className="stat-card-bar"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: 3,
              height: '100%',
              background: c.color,
              transition: 'width 0.18s ease, box-shadow 0.18s ease',
            }}
          />
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 10,
            }}
          >
            {c.label}
          </div>
          <div
            className="mono stat-card-value"
            style={{ fontSize: 30, fontWeight: 600, color: 'var(--text-primary)', transition: 'color 0.18s ease' }}
          >
            {loading ? '—' : stats?.[c.key] ?? 0}
          </div>
        </div>
      ))}
    </div>
  );
}
