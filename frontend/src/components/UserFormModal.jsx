import { useState } from 'react';
import Modal from './Modal';
import { fieldWrap, labelStyle, inputStyle, primaryBtn, secondaryBtn, errorBanner } from './formStyles';

export default function UserFormModal({ user, onClose, onSaved, onSubmit }) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'employee',
    department: user?.department || '',
    isActive: user?.isActive ?? true,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || (!isEdit && !form.password)) {
      setError('Name, email and password are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      await onSubmit(payload, user?._id);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong while saving the user.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit user' : 'Create new user'} onClose={onClose} width={460}>
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
          <label style={labelStyle}>Full name</label>
          <input style={inputStyle} value={form.name} onChange={update('name')} placeholder="e.g. Jordan Lee" />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>Email</label>
          <input type="email" style={inputStyle} value={form.email} onChange={update('email')} placeholder="jordan@company.com" />
        </div>

        <div style={fieldWrap}>
          <label style={labelStyle}>{isEdit ? 'New password (leave blank to keep current)' : 'Password'}</label>
          <input type="password" style={inputStyle} value={form.password} onChange={update('password')} placeholder="Min. 6 characters" />
        </div>

        <div className="form-grid-2">
          <div style={fieldWrap}>
            <label style={labelStyle}>Role</label>
            <select style={inputStyle} value={form.role} onChange={update('role')}>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Department</label>
            <input style={inputStyle} value={form.department} onChange={update('department')} placeholder="e.g. Engineering" />
          </div>
        </div>

        {isEdit && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 4 }}>
            <input type="checkbox" checked={form.isActive} onChange={update('isActive')} />
            Account is active
          </label>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button type="button" style={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" style={primaryBtn} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
