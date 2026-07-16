import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import TaskTable from '../components/TaskTable';
import TaskDetailModal from '../components/TaskDetailModal';
import MilestoneFormModal from '../components/MilestoneFormModal';
import { ProjectStatusBadge, MilestoneStatusBadge } from '../components/ProjectStatusBadge';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  // Projects and milestones stay strictly admin-managed, even for managers.
  const isAdmin = user.role === 'admin';

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [projectRes, tasksRes] = await Promise.all([
        api.get(`/projects/${id}`),
        api.get('/tasks', { params: { project: id } }),
      ]);
      setProject(projectRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load this project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleStatusChange = async (task, status) => {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t._id === task._id ? { ...t, status } : t)));
    try {
      await api.patch(`/tasks/${task._id}/status`, { status });
    } catch (err) {
      setTasks(prev);
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleMilestoneSubmit = async (form, milestoneId) => {
    if (milestoneId) {
      await api.put(`/projects/${id}/milestones/${milestoneId}`, form);
    } else {
      await api.post(`/projects/${id}/milestones`, form);
    }
  };

  const handleMilestoneDelete = async (milestone) => {
    if (!window.confirm(`Delete milestone "${milestone.title}"? Tasks linked to it will be unlinked.`)) return;
    try {
      const res = await api.delete(`/projects/${id}/milestones/${milestone._id}`);
      setProject(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete milestone');
    }
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <PageShell title="Loading project…">
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</div>
      </PageShell>
    );
  }

  if (error || !project) {
    return (
      <PageShell title="Project not found">
        <div
          style={{
            background: 'rgba(239, 100, 97, 0.1)',
            border: '1px solid rgba(239, 100, 97, 0.35)',
            color: 'var(--text-error)',
            padding: '12px 14px',
            borderRadius: 8,
            fontSize: 13.5,
          }}
        >
          {error || 'This project could not be found.'}
        </div>
      </PageShell>
    );
  }

  const sortedMilestones = [...(project.milestones || [])].sort(
    (a, b) => new Date(a.dueDate) - new Date(b.dueDate)
  );

  return (
    <PageShell
      title={project.name}
      subtitle={project.client ? `Client: ${project.client}` : undefined}
      actions={
        isAdmin && (
          <button onClick={handleDeleteProject} style={dangerBtn}>
            Delete project
          </button>
        )
      }
    >
      <Link to="/projects" style={{ fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 600, display: 'inline-block', marginBottom: 18 }}>
        ← All projects
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <ProjectStatusBadge status={project.status} />
        {project.startDate && (
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Start: {new Date(project.startDate).toLocaleDateString()}
          </span>
        )}
        {project.targetEndDate && (
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Target end: {new Date(project.targetEndDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {project.description && (
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 28, maxWidth: 720 }}>
          {project.description}
        </p>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: 0 }}>Milestones</h2>
        {isAdmin && (
          <button
            onClick={() => {
              setEditingMilestone(null);
              setShowMilestoneForm(true);
            }}
            style={smallPrimaryBtn}
          >
            + Add milestone
          </button>
        )}
      </div>

      {sortedMilestones.length === 0 ? (
        <div
          style={{
            border: '1px dashed var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px 20px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 13.5,
            marginBottom: 32,
          }}
        >
          No milestones yet.
        </div>
      ) : (
        <div
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-hairline-soft)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 32,
            overflow: 'hidden',
          }}
        >
          {sortedMilestones.map((m, i) => (
            <div
              key={m._id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                padding: '14px 18px',
                borderBottom: i === sortedMilestones.length - 1 ? 'none' : '1px solid var(--border-hairline-soft)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{m.title}</div>
                {m.description && (
                  <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 2 }}>{m.description}</div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Due {new Date(m.dueDate).toLocaleDateString()}
                </span>
                <MilestoneStatusBadge status={m.status} />
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        setEditingMilestone(m);
                        setShowMilestoneForm(true);
                      }}
                      style={iconBtnStyle}
                    >
                      Edit
                    </button>
                    <button onClick={() => handleMilestoneDelete(m)} style={{ ...iconBtnStyle, color: 'var(--status-cancelled)' }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Tasks in this project</h2>
      <TaskTable
        tasks={tasks}
        isAdmin={false}
        onStatusChange={handleStatusChange}
        onRowClick={(task) => setDetailTaskId(task._id)}
        emptyLabel="No tasks in this project yet."
      />

      {showMilestoneForm && (
        <MilestoneFormModal
          milestone={editingMilestone}
          onClose={() => setShowMilestoneForm(false)}
          onSaved={() => {
            setShowMilestoneForm(false);
            load();
          }}
          onSubmit={handleMilestoneSubmit}
        />
      )}

      {detailTaskId && <TaskDetailModal taskId={detailTaskId} onClose={() => setDetailTaskId(null)} />}
    </PageShell>
  );
}

const iconBtnStyle = {
  background: 'transparent',
  border: '1px solid var(--border-hairline)',
  color: 'var(--text-secondary)',
  borderRadius: 6,
  padding: '5px 10px',
  fontSize: 11.5,
  cursor: 'pointer',
};

const smallPrimaryBtn = {
  background: 'var(--accent-cyan)',
  color: '#0b1017',
  border: 'none',
  borderRadius: 8,
  padding: '8px 14px',
  fontSize: 12.5,
  fontWeight: 700,
  cursor: 'pointer',
};

const dangerBtn = {
  background: 'transparent',
  border: '1px solid rgba(239, 100, 97, 0.4)',
  color: 'var(--status-cancelled)',
  borderRadius: 8,
  padding: '10px 16px',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
};
