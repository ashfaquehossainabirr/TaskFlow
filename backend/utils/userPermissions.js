// Centralizes the "main admin" permission rules so routes/users.js doesn't
// have to repeat this logic across create/update/delete. In every function
// below, `actor` is req.user (the person making the request).
//
// Rules:
//   - Only the main admin can create a new admin account.
//   - Only the main admin can change another admin's password (an admin can
//     always change their own password).
//   - Only the main admin can delete an admin account.
//   - The main admin account itself can never be deleted (there must always
//     be exactly one, and demoting/removing it has to go through a deliberate
//     hand-off, not a regular delete call).
//   - Regular admins can freely create/delete/reset passwords for managers
//     and employees - none of these restrictions apply outside role 'admin'.

const canCreateRole = (actor, role) => {
  if (role !== 'admin') return true;
  return Boolean(actor.isMainAdmin);
};

const canChangePassword = (actor, targetUser) => {
  if (String(actor._id) === String(targetUser._id)) return true; // always allowed to change your own
  if (targetUser.role !== 'admin') return true;
  return Boolean(actor.isMainAdmin);
};

const canGrantAdminRole = (actor) => Boolean(actor.isMainAdmin);

// Covers moving a user's role into OR out of 'admin' - both are a change to
// admin access, so both are restricted to the main admin. Ordinary role
// swaps between manager/employee are unaffected.
const canChangeAdminRole = (actor, currentRole, newRole) => {
  if (newRole === currentRole) return true;
  if (newRole !== 'admin' && currentRole !== 'admin') return true;
  return Boolean(actor.isMainAdmin);
};

const canDeleteUser = (actor, targetUser) => {
  if (targetUser.isMainAdmin) return false; // the main admin account can never be deleted
  if (targetUser.role !== 'admin') return true;
  return Boolean(actor.isMainAdmin);
};

module.exports = { canCreateRole, canChangePassword, canGrantAdminRole, canChangeAdminRole, canDeleteUser };
