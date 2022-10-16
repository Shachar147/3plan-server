import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { deepClone } from '../shared/utils';

import * as mock_response from '../../test/mocks/responses.mock';
import { mockUserRepository } from '../../test/mocks/user.repository.mock';

describe('UserService', () => {
  let service;
  let userRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserRepository, useFactory: mockUserRepository },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    // mocks
    userRepository = module.get<UserRepository>(UserRepository);
  });

  describe('Should be Defined', () => {
    it('service should be defined', () => {
      expect(service).toBeDefined();
    });

    it('userRepository should be defined', () => {
      expect(userRepository).toBeDefined();
    });
  });

  describe('getUsers', () => {
    it('should be defined', () => {
      expect(service.getUsers).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof(service.getUsers)).toEqual('function');
    });

    it('inner function calls', async () => {
      userRepository.getUsers.mockResolvedValue([{}]);
      expect(userRepository.getUsers).not.toHaveBeenCalled();

      const result = await service.getUsers({});
      expect(userRepository.getUsers).toHaveBeenCalled();
    });

  });

});