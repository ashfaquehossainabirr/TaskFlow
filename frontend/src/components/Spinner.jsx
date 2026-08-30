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

  // Full-page loads (route-level auth checks, etc.) get the branded mark —
  // matching the boot splash in index.html — instead of a plain ring, so the
  // app never dips back into a generic spinner once it's already loaded.
  const brandedMark = (
    <div className="tf-brand-mark" aria-hidden="true">
      <span className="tf-brand-glow" />
      <span className="tf-brand-ring" />
      <span className="tf-brand-ring tf-brand-ring--2" />
      <span className="tf-brand-logo">T</span>
    </div>
  );

  const content = inline ? (
    <span className="tf-spinner-inline">
      {ring}
      {label && <span className="tf-spinner-label tf-spinner-label--inline">{label}</span>}
    </span>
  ) : fullpage ? (
    <div className="tf-spinner-stack">
      {brandedMark}
      <span className="tf-brand-word">TaskFlow</span>
      {label && <span className="tf-spinner-label">{label}</span>}
    </div>
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
          gap: 14px;
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
          animation: tf-fade-in 0.35s ease;
        }
        .tf-brand-mark {
          position: relative;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .tf-brand-glow {
          position: absolute;
          inset: -22px;
          border-radius: 50%;
          background: radial-gradient(circle, var(--accent-cyan-dim), transparent 70%);
          opacity: 0.7;
          animation: tf-brand-breathe 2.6s ease-in-out infinite;
        }
        .tf-brand-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: var(--accent-cyan);
          border-right-color: var(--accent-cyan-dim);
          animation: tf-spin 1.1s cubic-bezier(0.6, 0.1, 0.4, 0.9) infinite;
        }
        .tf-brand-ring--2 {
          inset: -9px;
          border-top-color: transparent;
          border-right-color: transparent;
          border-bottom-color: var(--status-progress);
          border-left-color: var(--accent-cyan-dim);
          animation-duration: 1.7s;
          animation-direction: reverse;
        }
        .tf-brand-logo {
          position: relative;
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: linear-gradient(135deg, var(--accent-cyan), var(--status-progress));
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-weight: 700;
          font-size: 15px;
          color: var(--text-on-accent);
          box-shadow: 0 0 20px -4px var(--accent-cyan);
          animation: tf-brand-pulse 1.8s ease-in-out infinite;
        }
        .tf-brand-word {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 17px;
          letter-spacing: -0.01em;
          color: var(--text-primary);
          opacity: 0;
          animation: tf-boot-word-in 0.5s ease 0.1s forwards;
        }
        @keyframes tf-brand-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }
        @keyframes tf-brand-breathe {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.1); }
        }
        @keyframes tf-boot-word-in {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tf-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tf-spinner,
          .tf-brand-ring,
          .tf-brand-glow,
          .tf-brand-logo {
            animation-duration: 1.8s;
          }
          .tf-spinner-fullpage {
            animation: none;
          }
        }
      `}</style>
      {fullpage ? <div className="tf-spinner-fullpage">{content}</div> : content}
    </>
  );
}
