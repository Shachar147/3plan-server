import { Test, TestingModule } from '@nestjs/testing';
import { UserRepository } from '../user/user.repository';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { deepClone } from '../shared/utils';

import * as mock_response from '../../test/mocks/responses.mock';
import { mockJwtService } from '../../test/mocks/jwt.service';
import { mockUserRepository } from '../../test/mocks/user.repository.mock';

describe('AuthService', () => {
  let service;
  let userRepository;
  let jwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useFactory: mockUserRepository },
        { provide: JwtService, useFactory: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // mocks
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('Should be Defined', () => {
    it('service should be defined', () => {
      expect(service).toBeDefined();
    });

    it('userRepository should be defined', () => {
      expect(userRepository).toBeDefined();
    });

    it('jwtService should be defined', () => {
      expect(jwtService).toBeDefined();
    });
  });

  describe('signUp', () => {
    it('should be defined', () => {
      expect(service.signUp).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof(service.signUp)).toEqual('function');
    });

    it('inner function calls', async () => {
      userRepository.signUp.mockResolvedValue([{}]);
      expect(userRepository.signUp).not.toHaveBeenCalled();

      const result = await service.signUp({"username":"user","password":"pass"});
      expect(userRepository.signUp).toHaveBeenCalled();
    });

  });

  describe('signIn', () => {
    it('should be defined', () => {
      expect(service.signIn).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof(service.signIn)).toEqual('function');
    });

    it('inner function calls', async () => {
      jwtService.sign.mockResolvedValue([{}]);
      userRepository.validateUserPassword.mockResolvedValue([{}]);
      expect(userRepository.validateUserPassword).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();

      const result = await service.signIn({"username":"user","password":"pass"});
      expect(userRepository.validateUserPassword).toHaveBeenCalled();
      expect(jwtService.sign).toHaveBeenCalled();
    });

  });

});