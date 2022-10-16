export const mockSpaceJamRepository = () => ({
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  listRecords: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
});