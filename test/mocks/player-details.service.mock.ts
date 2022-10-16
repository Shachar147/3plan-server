export const mockPlayerDetailsService = () => ({
  getPlayersDetails: jest.fn(),
  createPlayerDetails: jest.fn(),
  syncPlayerById: jest.fn(),
  syncPlayer: jest.fn(),
  syncPopularPlayers: jest.fn(),
  syncAllPlayers: jest.fn(),
  syncAllPlayersBulk: jest.fn(),
});