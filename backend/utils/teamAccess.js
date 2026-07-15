const User = require('../models/User');

// Every employee _id that reports to this manager.
async function getTeamMemberIds(managerId) {
  const members = await User.find({ manager: managerId }).select('_id');
  return members.map((m) => m._id);
}

// True if `employeeId` reports to `managerId`.
async function isTeamMember(managerId, employeeId) {
  if (!employeeId) return false;
  const match = await User.exists({ _id: employeeId, manager: managerId });
  return Boolean(match);
}

module.exports = { getTeamMemberIds, isTeamMember };
