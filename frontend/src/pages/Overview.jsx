import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageShell from '../components/PageShell';
import StatsCards from '../components/StatsCards';
import TaskCompletionDonut from '../components/TaskCompletionDonut';
import TaskTable from '../components/TaskTable';
import TaskDetailModal from '../components/TaskDetailModal';
import NoticeBoard from '../components/NoticeBoard';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { canManageTasks } from '../utils/roles';

export default function Overview() {
  const { user } = useAuth();
  const isManager = canManageTasks(user.role);
  const [stats, setStats] = useState(null);
  const [urgentTasks, setUrgentTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailTaskId, setDetailTaskId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, deadlineRes] = await Promise.all([
        api.get('/tasks/stats'),
        api.get('/tasks/deadlines/upcoming'),
      ]);
      setStats(statsRes.data);
      setUrgentTasks(deadlineRes.data.slice(0, 5));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <PageShell
      title={`Welcome back, ${user.name.split(' ')[0]}`}
      subtitle={isManager ? "Here's how the team's work is tracking today." : "Here's what's on your plate today."}
    >

      <StatsCards stats={stats} loading={loading} />

      <div style={{ marginBottom: 28 }}>
        <TaskCompletionDonut stats={stats} loading={loading} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, margin: 0 }}>
          Deadline Watch <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>· due in 3 days or less</span>
        </h2>
        <Link to="/deadlines" style={{ fontSize: 13, color: 'var(--accent-cyan)', fontWeight: 600 }}>
          View all →
        </Link>
      </div>

      <TaskTable
        tasks={urgentTasks}
        isAdmin={false}
        onRowClick={(task) => setDetailTaskId(task._id)}
        emptyLabel="Nothing urgent right now — all deadlines are more than 3 days out."
      />

      <div style={{ marginTop: 32 }}>
        <NoticeBoard />
      </div>

      {detailTaskId && <TaskDetailModal taskId={detailTaskId} onClose={() => setDetailTaskId(null)} />}
    </PageShell>
  );
}
