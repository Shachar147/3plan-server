"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const player_service_1 = require("./player.service");
const player_repository_1 = require("./player.repository");
const sync_service_1 = require("../sync/sync.service");
const team_service_1 = require("../team/team.service");
const common_1 = require("@nestjs/common");
const mockRepository = () => ({
    getPlayers: jest.fn(),
    getPlayer: jest.fn(),
    getPlayerByName: jest.fn(),
    createPlayer: jest.fn(),
    delete: jest.fn(),
    updatePlayer: jest.fn(),
    upsertPlayer: jest.fn(),
    _getPlayerByName: jest.fn(),
});
const mockSyncService = () => ({});
const mockTeamService = () => ({
    getTeamByName: jest.fn(),
});
describe('PlayerService', () => {
    let service;
    let repository;
    let syncService;
    let teamService;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                player_service_1.PlayerService,
                { provide: player_repository_1.PlayerRepository, useFactory: mockRepository },
                { provide: sync_service_1.SyncService, useFactory: mockSyncService },
                { provide: team_service_1.TeamService, useFactory: mockTeamService },
            ],
        }).compile();
        service = module.get(player_service_1.PlayerService);
        repository = module.get(player_repository_1.PlayerRepository);
        syncService = module.get(sync_service_1.SyncService);
        teamService = module.get(team_service_1.TeamService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('getPlayers', () => {
        it('get all players from the repository', async () => {
            repository.getPlayers.mockResolvedValue('some value');
            expect(repository.getPlayers).not.toHaveBeenCalled();
            const results = await service.getPlayers();
            expect(repository.getPlayers).toHaveBeenCalled();
            expect(results).toEqual('some value');
        });
    });
    describe('getPlayer', () => {
        it('get player by id from the repository', async () => {
            const mockResult = { name: 'Some Player' };
            repository.getPlayer.mockResolvedValue(mockResult);
            expect(repository.getPlayer).not.toHaveBeenCalled();
            const result = await service.getPlayer(1);
            expect(repository.getPlayer).toHaveBeenCalledWith(1);
            expect(result).toEqual(mockResult);
        });
        it('throws an error if player not exist', () => {
            repository.getPlayer.mockResolvedValue(null);
            const id = 1;
            expect(service.getPlayer(id)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('getPlayerByName', () => {
        it('get player by name from the repository', async () => {
            const name = 'Some Player';
            const mockResult = { name: name };
            repository.getPlayerByName.mockResolvedValue(mockResult);
            expect(repository._getPlayerByName).not.toHaveBeenCalled();
            const result = await service.getPlayerByName(name);
            expect(repository._getPlayerByName).toHaveBeenCalledWith(name);
            expect(result).toEqual(mockResult);
        });
        it('throws an error if player not exist', () => {
            repository.getPlayerByName.mockResolvedValue(null);
            const id = 1;
            expect(service.getPlayerByName(id)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('createPlayer', () => {
        it('throws an error if team_name not supplied', () => {
            expect(repository.createPlayer).not.toHaveBeenCalled();
            const createPlayerDto = { name: 'Some Player' };
            expect(service.createPlayer(createPlayerDto)).rejects.toThrow(common_1.BadRequestException);
        });
        it('throws an error if team_name supplied but not exist', () => {
            teamService.getTeamByName.mockRejectedValue(new common_1.NotFoundException(`Error`));
            expect(repository.createPlayer).not.toHaveBeenCalled();
            const createPlayerDto = { name: 'Some Player', team_name: 'Some Team' };
            expect(service.createPlayer(createPlayerDto)).rejects.toThrow(common_1.NotFoundException);
        });
        it('calls playerRepository.create() and returns the result', async () => {
            const mockResult = 'Some Player';
            repository.createPlayer.mockResolvedValue(mockResult);
            const mockTeam = { id: '1', name: 'Some Team' };
            teamService.getTeamByName.mockResolvedValue(mockTeam);
            expect(repository.createPlayer).not.toHaveBeenCalled();
            const createPlayerDto = { name: 'Some Player', team_name: 'Some Team' };
            const result = await service.createPlayer(createPlayerDto);
            expect(repository.createPlayer).toHaveBeenCalledWith(createPlayerDto, mockTeam, undefined);
            expect(result).toEqual(mockResult);
        });
    });
    describe('deletePlayer', () => {
        it('throws exception when trying to delete a player that not exist', async () => {
            repository.delete.mockResolvedValue({ affected: 1 });
            expect(repository.delete).not.toHaveBeenCalled();
            const result = await service.deletePlayer(1);
            expect(repository.delete).toHaveBeenCalledWith({ id: 1 });
            expect(result).toEqual({ affected: 1 });
        });
        it('calls playerRepository.deletePlayer() and returns results', async () => {
            repository.delete.mockResolvedValue({ affected: 0 });
            expect(repository.delete).not.toHaveBeenCalled();
            expect(service.deletePlayer(1)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('updatePlayer', () => {
        it('throws exception when trying to update non existing player', async () => {
            repository.getPlayer.mockRejectedValue(new common_1.NotFoundException(`Error`));
            const updateFilterDto = {
                name: undefined,
                picture: undefined,
                height_feet: undefined,
                position: undefined,
                weight_pounds: undefined,
                height_inches: undefined,
                team_name: undefined,
            };
            expect(service.updatePlayer(1, updateFilterDto)).rejects.toThrow(common_1.NotFoundException);
        });
        it('throws exception when trying to update without sending anything to update', async () => {
            repository.getPlayer.mockResolvedValue({ id: 1, name: 'Some Player' });
            const updateFilterDto = {
                name: undefined,
                picture: undefined,
                height_feet: undefined,
                position: undefined,
                weight_pounds: undefined,
                height_inches: undefined,
                team_name: undefined,
            };
            expect(service.updatePlayer(1, updateFilterDto)).rejects.toThrow(common_1.BadRequestException);
        });
        it('throws exception when trying to update team to non existing team', async () => {
            teamService.getTeamByName.mockRejectedValue(new common_1.NotFoundException(`Team Not Found`));
            repository.getPlayer.mockResolvedValue({ id: 1, name: 'Some Player' });
            repository.getPlayerByName.mockResolvedValue('Some Player');
            const updateFilterDto = {
                team_name: 'Non Existing Team',
                name: undefined,
                picture: undefined,
                height_feet: undefined,
                height_inches: undefined,
                weight_pounds: undefined,
                position: undefined,
            };
            expect(service.updatePlayer(1, updateFilterDto)).rejects.toThrow(common_1.NotFoundException);
        });
        it('calls playerRepository.updatePlayer() and returns results', async () => {
            teamService.getTeamByName.mockResolvedValue('New Team');
            const player = 'Some Player';
            repository.getPlayer.mockResolvedValue(player);
            const updateFilterDto = {
                name: 'New Name',
                team_name: 'New Team',
                picture: undefined,
                height_feet: undefined,
                position: undefined,
                weight_pounds: undefined,
                height_inches: undefined,
            };
            const updated_player = { name: 'New Name', Team: 'New Team' };
            repository.updatePlayer.mockResolvedValue(updated_player);
            expect(repository.updatePlayer).not.toHaveBeenCalled();
            const result = await service.updatePlayer(1, updateFilterDto);
            expect(repository.updatePlayer).toHaveBeenCalledWith(updateFilterDto, player, 'New Team');
            expect(result).toEqual(updated_player);
        });
    });
    describe('upsertPlayer', () => {
        it('throws exception when trying to update without required parameters', async () => {
        });
        it('throws exception when trying to upsert with non existing team', async () => {
        });
        it('creating new player when trying to upsert non existing player', async () => {
            teamService.getTeamByName.mockResolvedValue('Some Team');
            repository._getPlayerByName.mockResolvedValue(undefined);
            repository.upsertPlayer.mockResolvedValue('Player Created');
            const upsertFilterDto = {
                name: 'Some Player',
                team_name: 'Some Team',
                picture: 'pic',
                height_feet: undefined,
                position: undefined,
                weight_pounds: undefined,
                height_inches: undefined,
            };
            expect(repository.updatePlayer).not.toHaveBeenCalled();
            const result = await service.upsertPlayer(upsertFilterDto);
            expect(teamService.getTeamByName).toHaveBeenCalledWith('Some Team');
            expect(repository.upsertPlayer).toHaveBeenCalledWith(upsertFilterDto, 'Some Team');
            expect(result).toEqual('Player Created');
        });
        it('updating existing player when already exist', async () => {
        });
    });
    describe('syncPlayers', () => {
        it('throws exception and returns errors when trying to sync playres and team not exist', async () => {
        });
        it('call repository.upsertPlayer', async () => {
        });
    });
});
//# sourceMappingURL=player.service.spec.backup.js.map