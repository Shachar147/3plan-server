export const mockUserSettingsRepository = () => ({
  createDefaultSettings: jest.fn(),
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  listRecords: jest.fn(),
  getInActive: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
});