// Admins and managers can create/edit/delete/assign tasks and see team-wide
// views. Plain employees only ever act on their own assigned tasks.
export const canManageTasks = (role) => role === 'admin' || role === 'manager';
