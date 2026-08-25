/**
 * Branded loading spinner used across TaskFlow.
 *
 * size:  'sm' | 'md' | 'lg'  -> dot diameter presets
 * label: optional text shown next to/under the spinner
 * fullpage: renders centered in a full-viewport-height wrapper (for route-level loads)
 * inline: renders as a compact inline row (icon + label), for buttons/small areas
 */
export default function Spinner({ size = 'md', label, fullpage = false, inline = false }) {
  const dims = {
    sm: 16,
    md: 28,
    lg: 40,
  };
  const d = dims[size] || dims.md;

  const ring = (
    <span
      className="tf-spinner"
      style={{
        width: d,
        height: d,
        borderWidth: Math.max(2, Math.round(d / 10)),
      }}
      aria-hidden="true"
    />
  );

  const content = inline ? (
    <span className="tf-spinner-inline">
      {ring}
      {label && <span className="tf-spinner-label tf-spinner-label--inline">{label}</span>}
    </span>
  ) : (
    <div className="tf-spinner-stack">
      {ring}
      {label && <span className="tf-spinner-label">{label}</span>}
    </div>
  );

  return (
    <>
      <style>{`
        .tf-spinner {
          display: inline-block;
          border-style: solid;
          border-color: var(--border-hairline);
          border-top-color: var(--accent-cyan);
          border-radius: 50%;
          animation: tf-spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes tf-spin {
          to { transform: rotate(360deg); }
        }
        .tf-spinner-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .tf-spinner-inline {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .tf-spinner-label {
          color: var(--text-muted);
          font-size: 13.5px;
          letter-spacing: 0.01em;
        }
        .tf-spinner-label--inline {
          font-size: 13px;
        }
        .tf-spinner-fullpage {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          width: 100%;
        }
        @media (prefers-reduced-motion: reduce) {
          .tf-spinner {
            animation-duration: 1.4s;
          }
        }
      `}</style>
      {fullpage ? <div className="tf-spinner-fullpage">{content}</div> : content}
    </>
  );
}
