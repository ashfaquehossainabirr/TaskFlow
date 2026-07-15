import DonutChart from './DonutChart';

export default function TaskCompletionDonut({ stats, loading }) {
  const total = stats?.total ?? 0;
  const completed = stats?.delivered ?? 0;
  const pending = Math.max(0, total - completed);

  const segments = [
    { label: 'Pending', value: pending, color: 'var(--status-progress)' },
    { label: 'Completed', value: completed, color: 'var(--status-delivered)' },
  ];

  return (
    <div
      style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-hairline-soft)',
        borderRadius: 'var(--radius-lg)',
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        width: '100%',
        maxWidth: 1640,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          alignSelf: 'flex-start',
        }}
      >
        Task Completion
      </div>

      {loading ? (
        <div
          style={{
            width: 160,
            height: 160,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: 13,
          }}
        >
          Loading…
        </div>
      ) : (
        <DonutChart segments={segments} size={160} thickness={22} />
      )}

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
              {s.label}{' '}
              <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {s.value}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div className="mono" style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}>
        {loading ? '—' : `${total} total task${total === 1 ? '' : 's'}`}
      </div>
    </div>
  );
}
