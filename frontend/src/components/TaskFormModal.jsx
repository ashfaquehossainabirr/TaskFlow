import { useMemo, useState } from 'react';
import Modal from './Modal';
import { fieldWrap, labelStyle, inputStyle, primaryBtn, secondaryBtn, errorBanner } from './formStyles';
import { STATUS_LABELS } from '../utils/deadline';

const toDateInputValue = (d) => {
  if (!d) return '';
  const date = new Date(d);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
};

export default function TaskFormModal({ task, employees, projects, onClose, onSaved, onSubmit }) {
  const isEdit = Boolean(task);
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    project: task?.project?._id || task?.project || '',
    milestone: task?.milestone || '',
    priority: task?.priority || 'medium',
    deadline: toDateInputValue(task?.deadline) || '',
    assignedTo: task?.assignedTo?._id || task?.assignedTo || '',
    status: task?.status || 'todo',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.value,
      // Changing the project invalidates whatever milestone was picked before,
      // since milestones belong to a specific project.
      ...(key === 'project' ? { milestone: '' } : {}),
    }));

  const availableMilestones = useMemo(() => {
    const selected = projects.find((p) => p._id === form.project);
    return selected?.milestones || [];
  }, [projects, form.project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.title || !form.project || !form.deadline || !form.assignedTo) {
      setError('Please fill in title, project, deadline and assignee.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, milestone: form.milestone || null };
      await onSubmit(payload, task?._id);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong while saving the task.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit task' : 'Create & assign task'} onClose={onClose} width={520}>
      <style>{`
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 480px) {
          .form-grid-2 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <form onSubmit={handleSubmit}>
        {error && <div style={errorBanner}>{error}</div>}

        <div style={fieldWrap}>
          <label style={labelStyle}>Task title</label>
          <input style={inputStyle} value={form.title} onChange={update('title')} placeholder="e.g. Build login page" />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Description</label>
          <textarea
            style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
            value={form.description}
            onChange={update('description')}
            placeholder="Optional details about the task"
          />
        </div>

        <div className="form-grid-2">
          <div style={fieldWrap}>
            <label style={labelStyle}>Project</label>
            <select style={inputStyle} value={form.project} onChange={update('project')}>
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Milestone (optional)</label>
            <select
              style={inputStyle}
              value={form.milestone}
              onChange={update('milestone')}
              disabled={!form.project || availableMilestones.length === 0}
            >
              <option value="">
                {!form.project
                  ? 'Pick a project first'
                  : availableMilestones.length === 0
                  ? 'No milestones on this project'
                  : 'None'}
              </option>
              {availableMilestones.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div style={fieldWrap}>
            <label style={labelStyle}>Priority</label>
            <select style={inputStyle} value={form.priority} onChange={update('priority')}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Status</label>
            <select style={inputStyle} value={form.status} onChange={update('status')}>
              {Object.keys(STATUS_LABELS).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div style={fieldWrap}>
            <label style={labelStyle}>Deadline</label>
            <input type="date" style={inputStyle} value={form.deadline} onChange={update('deadline')} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Assign to employee</label>
            <select style={inputStyle} value={form.assignedTo} onChange={update('assignedTo')}>
              <option value="">Select an employee…</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name} {emp.department ? `— ${emp.department}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {projects.length === 0 && (
          <div style={{ ...errorBanner, background: 'rgba(240, 168, 63, 0.1)', border: '1px solid rgba(240, 168, 63, 0.3)', color: '#ffb454' }}>
            No projects exist yet. Create one from the Projects page first.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button type="button" style={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" style={primaryBtn} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
