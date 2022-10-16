export const mockUserRepository = () => ({
  signUp: jest.fn(),
  getUserByName: jest.fn(),
  validateUserPassword: jest.fn(),
  hashPassword: jest.fn(),
  getUsers: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
});