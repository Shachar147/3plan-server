export const mockTeamService = () => ({
  getTeams: jest.fn(),
  getTeam: jest.fn(),
  getTeamByNameFull: jest.fn(),
  getTeamByName: jest.fn(),
  createTeam: jest.fn(),
  upsertTeam: jest.fn(),
  syncTeam: jest.fn(),
  syncTeams: jest.fn(),
  syncTeamsRatings: jest.fn(),
  updateTeam: jest.fn(),
  deleteTeam: jest.fn(),
});