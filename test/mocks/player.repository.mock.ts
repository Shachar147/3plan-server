export const mockPlayerRepository = () => ({
  createPlayer: jest.fn(),
  _getPlayerByName: jest.fn(),
  upsertPlayer: jest.fn(),
  updatePlayer: jest.fn(),
  getPlayerByName: jest.fn(),
  getPlayer: jest.fn(),
  getPlayers: jest.fn(),
  inActivePlayer: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
});