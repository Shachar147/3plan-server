export const mockRandomRepository = () => ({
  createRecord: jest.fn(),
  updateRecord: jest.fn(),
  listRecords: jest.fn(),
  listRecordsByDate: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
});