const MINI_STATS = [
  { key: 'todo', label: 'To Do', color: 'var(--status-todo)' },
  { key: 'in-progress', label: 'In Progress', color: 'var(--status-progress)' },
  { key: 'hold', label: 'On Hold', color: 'var(--status-hold)' },
  { key: 'delivered', label: 'Delivered', color: 'var(--status-delivered)' },
  { key: 'cancelled', label: 'Cancelled', color: 'var(--status-cancelled)' },
];

export default function EmployeeStatCard({ employee }) {
  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-hairline-soft)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{employee.name}</div>
          <div
            className="mono"
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {employee.email}
          </div>
          {employee.department && (
            <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 3 }}>{employee.department}</div>
          )}
        </div>

        <div
          style={{
            textAlign: 'right',
            flexShrink: 0,
            padding: '6px 12px',
            background: 'var(--bg-inset)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 8,
          }}
        >
          <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent-cyan)', lineHeight: 1.1 }}>
            {employee.projects}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Projects
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(84px, 1fr))',
          gap: 8,
        }}
      >
        {MINI_STATS.map((s) => (
          <div
            key={s.key}
            style={{
              background: 'var(--bg-inset)',
              border: '1px solid var(--border-hairline-soft)',
              borderRadius: 8,
              padding: '9px 10px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: s.color }} />
            <div className="mono" style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>
              {employee[s.key] ?? 0}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textAlign: 'right', borderTop: '1px solid var(--border-hairline-soft)', paddingTop: 10 }}>
        <span className="mono">{employee.total}</span> task{employee.total === 1 ? '' : 's'} total
      </div>
    </div>
  );
}
