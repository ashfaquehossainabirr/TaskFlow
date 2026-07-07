import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import TaskTable from '../components/TaskTable';
import TaskFormModal from '../components/TaskFormModal';
import TaskDetailModal from '../components/TaskDetailModal';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { STATUS_LABELS } from '../utils/deadline';

export default function Tasks() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.projectName = search;
      const res = await api.get('/tasks', { params });
      setTasks(res.data);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    if (!isAdmin) return;
    const res = await api.get('/users', { params: { role: 'employee' } });
    setEmployees(res.data);
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadTasks, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search]);

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

  const handleSubmit = async (form, taskId) => {
    if (taskId) {
      await api.put(`/tasks/${taskId}`, form);
    } else {
      await api.post('/tasks', form);
    }
  };

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      setTasks((ts) => ts.filter((t) => t._id !== task._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    }
  };

  return (
    <PageShell
      title={isAdmin ? 'All Tasks' : 'My Tasks'}
      subtitle={isAdmin ? 'Create, assign, and track every task across the team.' : 'Update the status of tasks assigned to you.'}
      actions={
        isAdmin && (
          <button
            onClick={() => {
              setEditingTask(null);
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
            + New task
          </button>
        )
      }
    >
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          placeholder="Search by project name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            background: 'var(--bg-inset)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 8,
            padding: '9px 12px',
            fontSize: 13.5,
            color: 'var(--text-primary)',
            minWidth: 220,
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: 'var(--bg-inset)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 8,
            padding: '9px 12px',
            fontSize: 13.5,
            color: 'var(--text-primary)',
          }}
        >
          <option value="">All statuses</option>
          {Object.keys(STATUS_LABELS).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <TaskTable
        tasks={tasks}
        isAdmin={isAdmin}
        onStatusChange={handleStatusChange}
        onEdit={(task) => {
          setEditingTask(task);
          setShowForm(true);
        }}
        onDelete={handleDelete}
        onRowClick={(task) => setDetailTaskId(task._id)}
        emptyLabel={loading ? 'Loading tasks…' : 'No tasks match your filters.'}
      />

      {showForm && (
        <TaskFormModal
          task={editingTask}
          employees={employees}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            loadTasks();
          }}
          onSubmit={handleSubmit}
        />
      )}

      {detailTaskId && <TaskDetailModal taskId={detailTaskId} onClose={() => setDetailTaskId(null)} />}
    </PageShell>
  );
}
