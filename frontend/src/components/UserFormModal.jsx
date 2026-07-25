import { useState } from 'react';
import Modal from './Modal';
import { fieldWrap, labelStyle, inputStyle, primaryBtn, secondaryBtn, errorBanner } from './formStyles';

export default function UserFormModal({ user, managers, currentUser, onClose, onSaved, onSubmit }) {
  const isEdit = Boolean(user);
  const isSelf = isEdit && String(user._id) === String(currentUser._id);
  const targetIsAdmin = isEdit && user.role === 'admin';
  const targetIsMainAdmin = isEdit && Boolean(user.isMainAdmin);
  const viewerIsMainAdmin = Boolean(currentUser.isMainAdmin);

  // Only the main admin can promote someone to admin, demote an existing
  // admin, or change another admin's password.
  const canEditRole = viewerIsMainAdmin || !targetIsAdmin;
  const showAdminRoleOption = viewerIsMainAdmin || targetIsAdmin;
  const canEditPassword = isSelf || !targetIsAdmin || viewerIsMainAdmin;

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'employee',
    department: user?.department || '',
    manager: user?.manager || '',
    isActive: user?.isActive ?? true,
    makeMainAdmin: false,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
      // Manager assignment only makes sense for employees - clear it out
      // the moment the role changes to anything else.
      ...(key === 'role' && e.target.value !== 'employee' ? { manager: '' } : {}),
    }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name || !form.email || (!isEdit && !form.password)) {
      setError('Name, email and password are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, manager: form.role === 'employee' ? form.manager || null : null };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit && !canEditRole) delete payload.role; // locked in the UI, don't send a role the server would reject anyway
      if (!payload.makeMainAdmin) delete payload.isMainAdmin;
      else payload.isMainAdmin = true;
      delete payload.makeMainAdmin;
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
          {canEditPassword ? (
            <input type="password" style={inputStyle} value={form.password} onChange={update('password')} placeholder="Min. 6 characters" />
          ) : (
            <div style={{ ...inputStyle, color: 'var(--text-muted)', fontSize: 12.5, display: 'flex', alignItems: 'center' }}>
              Only the main admin can change another admin&rsquo;s password.
            </div>
          )}
        </div>

        <div className="form-grid-2">
          <div style={fieldWrap}>
            <label style={labelStyle}>Role</label>
            <select style={inputStyle} value={form.role} onChange={update('role')} disabled={!canEditRole}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              {showAdminRoleOption && <option value="admin">Admin</option>}
            </select>
            {!canEditRole && (
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
                Only the main admin can change a user into or out of the admin role.
              </div>
            )}
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Department</label>
            <input style={inputStyle} value={form.department} onChange={update('department')} placeholder="e.g. Engineering" />
          </div>
        </div>

        {form.role === 'employee' && (
          <div style={fieldWrap}>
            <label style={labelStyle}>Reports to (manager)</label>
            <select style={inputStyle} value={form.manager || ''} onChange={update('manager')}>
              <option value="">No manager assigned</option>
              {managers.map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {isEdit && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 4 }}>
            <input type="checkbox" checked={form.isActive} onChange={update('isActive')} />
            Account is active
          </label>
        )}

        {isEdit && viewerIsMainAdmin && !isSelf && form.role === 'admin' && !targetIsMainAdmin && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 4 }}>
            <input type="checkbox" checked={form.makeMainAdmin} onChange={update('makeMainAdmin')} />
            Make this the main admin account (this will remove main admin status from your own account)
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
