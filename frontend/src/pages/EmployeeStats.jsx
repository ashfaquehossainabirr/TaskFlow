import { useEffect, useState } from 'react';
import PageShell from '../components/PageShell';
import EmployeeStatCard from '../components/EmployeeStatCard';
import api from '../api/axios';

export default function EmployeeStats() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .get('/tasks/stats/by-employee')
      .then((res) => setEmployees(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load employee stats.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell title="Employee Stats" subtitle="Task load and status breakdown for every employee.">
      {loading && <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading employee stats…</div>}

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

      {!loading && !error && employees.length === 0 && (
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
          No employee accounts yet. Create one from Team &amp; Access.
        </div>
      )}

      {!loading && !error && employees.length > 0 && (
        <div className="employee-stats-grid">
          {employees.map((emp) => (
            <EmployeeStatCard key={emp._id} employee={emp} />
          ))}
        </div>
      )}

      <style>{`
        .employee-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        @media (max-width: 480px) {
          .employee-stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </PageShell>
  );
}
