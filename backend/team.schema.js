// MongoDB Team Schema (for use with native MongoDB driver, not Mongoose)
// Each team has a name and an array of members
// Each member has a name, role, and email (all required)

// This file is for reference and validation in API endpoints

export const TEAM_COLLECTION = 'teams';

export function validateTeam(team) {
  if (!team || typeof team !== 'object') return 'Team object required';
  if (!team.name || typeof team.name !== 'string' || !team.name.trim()) return 'Team Name is required';
  if (!Array.isArray(team.members) || team.members.length === 0) return 'At least one member is required';
  for (const member of team.members) {
    if (!member.name || typeof member.name !== 'string' || !member.name.trim()) return 'Member Name is required';
    if (!member.role || typeof member.role !== 'string' || !member.role.trim()) return 'Member Role is required';
    if (!member.email || typeof member.email !== 'string' || !member.email.trim()) return 'Member Email is required';
    // Basic email format check
    if (!/^\S+@\S+\.\S+$/.test(member.email)) return 'Invalid Email format for member: ' + member.name;
  }
  return null; // No error
}

// Example Team document structure:
// {
//   name: 'Team Alpha',
//   members: [
//     { name: 'Alice', role: 'Developer', email: 'alice@email.com' },
//     { name: 'Bob', role: 'Designer', email: 'bob@email.com' }
//   ]
// }
