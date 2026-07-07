import { useEffect, useState } from 'react';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import DeadlineChip from './DeadlineChip';
import api from '../api/axios';
import { daysRemaining } from '../utils/deadline';

const row = { display: 'flex', justifyContent: 'space-between', gap: 16, padding: '11px 0', borderBottom: '1px solid var(--border-hairline-soft)' };
const rowLabel = { fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 };
const rowValue = { fontSize: 13.5, color: 'var(--text-primary)', textAlign: 'right' };

export default function TaskDetailModal({ taskId, onClose }) {
  const [task, setTask] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .get(`/tasks/${taskId}`)
      .then((res) => {
        if (!cancelled) setTask(res.data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load task details.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [taskId]);

  return (
    <Modal title={loading ? 'Loading task…' : task?.title || 'Task details'} onClose={onClose} width={560}>
      {loading && <div style={{ padding: '20px 0', color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>}

      {error && (
        <div
          style={{
            background: 'rgba(239, 100, 97, 0.1)',
            border: '1px solid rgba(239, 100, 97, 0.35)',
            color: '#ff8a85',
            padding: '10px 12px',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {!loading && task && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <StatusBadge status={task.status} />
            <DeadlineChip deadline={task.deadline} status={task.status} />
            <PriorityPill priority={task.priority} />
          </div>

          {task.description && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ ...rowLabel, marginBottom: 6 }}>Description</div>
              <p style={{ fontSize: 13.5, color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>
                {task.description}
              </p>
            </div>
          )}

          <div style={{ marginBottom: 22 }}>
            <div style={row}>
              <span style={rowLabel}>Project</span>
              <span style={{ ...rowValue }} className="mono">
                {task.projectName}
              </span>
            </div>
            <div style={row}>
              <span style={rowLabel}>Assigned to</span>
              <span style={rowValue}>
                {task.assignedTo?.name || '—'}
                {task.assignedTo?.department ? ` · ${task.assignedTo.department}` : ''}
              </span>
            </div>
            <div style={row}>
              <span style={rowLabel}>Assignee email</span>
              <span style={rowValue} className="mono">
                {task.assignedTo?.email || '—'}
              </span>
            </div>
            <div style={row}>
              <span style={rowLabel}>Created by</span>
              <span style={rowValue}>{task.createdBy?.name || '—'}</span>
            </div>
            <div style={row}>
              <span style={rowLabel}>Deadline</span>
              <span style={rowValue}>
                {new Date(task.deadline).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
                {' · '}
                {formatDaysAbsolute(task.deadline)}
              </span>
            </div>
            <div style={row}>
              <span style={rowLabel}>Created</span>
              <span style={rowValue}>{new Date(task.createdAt).toLocaleDateString()}</span>
            </div>
            <div style={{ ...row, borderBottom: 'none' }}>
              <span style={rowLabel}>Last updated</span>
              <span style={rowValue}>{new Date(task.updatedAt).toLocaleString()}</span>
            </div>
          </div>

          {task.statusHistory && task.statusHistory.length > 0 && (
            <div>
              <div style={{ ...rowLabel, marginBottom: 10 }}>Status history</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[...task.statusHistory].reverse().map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: 'var(--accent-cyan)',
                        flexShrink: 0,
                      }}
                    />
                    <StatusBadge status={h.status} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {h.changedBy?.name || 'Unknown'} · {new Date(h.changedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function formatDaysAbsolute(deadline) {
  const days = daysRemaining(deadline);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'Due today';
  return `${days} day${days === 1 ? '' : 's'} remaining`;
}

function PriorityPill({ priority }) {
  const colors = {
    low: 'var(--text-muted)',
    medium: 'var(--status-progress)',
    high: 'var(--status-hold)',
    urgent: 'var(--status-cancelled)',
  };
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        color: colors[priority] || 'var(--text-secondary)',
        border: `1px solid ${colors[priority] || 'var(--border-hairline)'}`,
        borderRadius: 999,
        padding: '4px 10px',
      }}
    >
      {priority} priority
    </span>
  );
}
