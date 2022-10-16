export const mockOneOnOneRepository = () => ({
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  listRecords: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
});