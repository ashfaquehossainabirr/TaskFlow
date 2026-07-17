import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../components/PageShell';
import ProjectFormModal from '../components/ProjectFormModal';
import { ProjectStatusBadge } from '../components/ProjectStatusBadge';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user.role === 'admin';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (form, projectId) => {
    if (projectId) {
      await api.put(`/projects/${projectId}`, form);
    } else {
      await api.post('/projects', form);
    }
  };

  const handleDelete = async (project) => {
    if (!window.confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${project._id}`);
      setProjects((list) => list.filter((p) => p._id !== project._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete project');
    }
  };

  return (
    <PageShell
      title="Projects"
      subtitle="Every project and its milestones, in one place."
      actions={
        isAdmin && (
          <button
            onClick={() => {
              setEditingProject(null);
              setShowForm(true);
            }}
            style={{
              background: 'var(--accent-cyan)',
              color: '#0b1017',
              border: 'none',
              borderRadius: 8,
              padding: '10px 18px',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            + New project
          </button>
        )
      }
    >
      {loading && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading projects…</div>}

      {!loading && projects.length === 0 && (
        <div
          style={{
            border: '1px dashed var(--border-hairline)',
            borderRadius: 'var(--radius-lg)',
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: 14,
          }}
        >
          No projects yet.{isAdmin ? ' Create one to start assigning tasks.' : ''}
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 16,
          }}
        >
          {projects.map((p) => (
            <div
              key={p._id}
              onClick={() => navigate(`/projects/${p._id}`)}
              className="project-card"
              // style={{
              //   background: 'var(--bg-panel)',
              //   border: '1px solid var(--border-hairline-soft)',
              //   borderRadius: 'var(--radius-lg)',
              //   padding: 18,
              //   display: 'flex',
              //   flexDirection: 'column',
              //   gap: 10,
              //   minWidth: 0,
              //   cursor: 'pointer',
              // }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 15.5, color: 'var(--text-primary)', minWidth: 0 }}>{p.name}</div>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setEditingProject(p);
                        setShowForm(true);
                      }}
                      style={iconBtnStyle}
                    >
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p)} style={{ ...iconBtnStyle, color: 'var(--status-cancelled)' }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <ProjectStatusBadge status={p.status} />

              {p.description && (
                <p
                  style={{
                    fontSize: 12.5,
                    color: 'var(--text-secondary)',
                    margin: 0,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {p.description}
                </p>
              )}

              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  marginTop: 4,
                  paddingTop: 10,
                  borderTop: '1px solid var(--border-hairline-soft)',
                  fontSize: 12,
                  color: 'var(--text-muted)',
                }}
              >
                <span className="mono">{p.milestones?.length || 0} milestone{p.milestones?.length === 1 ? '' : 's'}</span>
                {p.client && <span>{p.client}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .project-card:hover {
          background: var(--bg-panel-raised);
          border-color: var(--border-hairline);
        }
      `}</style>

      {showForm && (
        <ProjectFormModal
          project={editingProject}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            load();
          }}
          onSubmit={handleSubmit}
        />
      )}
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
