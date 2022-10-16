export const mockDatanbanetService = () => ({
  _getTeamsMapping: jest.fn(),
  getTeams: jest.fn(),
  getPlayers: jest.fn(),
  _collectPlayers: jest.fn(),
  getRealGamesSchedule: jest.fn(),
  getTodayGames: jest.fn(),
  addGameStats: jest.fn(),
  getTodayGamesLive: jest.fn(),
});