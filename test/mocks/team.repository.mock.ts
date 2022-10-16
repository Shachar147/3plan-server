export const mockTeamRepository = () => ({
  createTeam: jest.fn(),
  upsertTeam: jest.fn(),
  updateTeam: jest.fn(),
  getTeams: jest.fn(),
  syncTeamsRatings: jest.fn(),
  _getTeamByName: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
});