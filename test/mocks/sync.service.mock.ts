export const mockSyncService = () => ({
  getTeams: jest.fn(),
  getAllStarTeams: jest.fn(),
  get3PointShooters: jest.fn(),
  getPlayers: jest.fn(),
  getTeamPlayersRatings: jest.fn(),
  getAllTeamsPlayersRatings: jest.fn(),
  getPlayerRealStats: jest.fn(),
  getPopularPlayersRealStats: jest.fn(),
});