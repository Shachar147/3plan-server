"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerDetailsRepository = void 0;
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
const player_details_entity_1 = require("./player-details.entity");
let PlayerDetailsRepository = class PlayerDetailsRepository extends typeorm_1.Repository {
    constructor() {
        super(...arguments);
        this.logger = new common_1.Logger('PlayerDetailsRepository');
    }
    async createPlayerDetails(createPlayerDto) {
        const { name, picture, GP, WP, MPG, PPG, RPG, APG, SPG, BPG, TPG, FGM, FGA, FGP, FTM, FTA, FTP, _3PM, _3PA, _3PP, MIN, PTS, REB, AST, STL, BLK, TOV, PF, PM, } = createPlayerDto;
        this.logger.log('Create Player Details - ' + name);
        const playerDetails = this.create();
        playerDetails.name = name;
        playerDetails.picture = picture;
        playerDetails.GP = GP;
        playerDetails.WP = WP;
        playerDetails.MPG = MPG;
        playerDetails.PPG = PPG;
        playerDetails.RPG = RPG;
        playerDetails.APG = APG;
        playerDetails.SPG = SPG;
        playerDetails.BPG = BPG;
        playerDetails.TPG = TPG;
        playerDetails.FGM = FGM;
        playerDetails.FGA = FGA;
        playerDetails.FGP = FGP;
        playerDetails.FTM = FTM;
        playerDetails.FTA = FTA;
        playerDetails.FTP = FTP;
        playerDetails._3PM = _3PM;
        playerDetails._3PA = _3PA;
        playerDetails._3PP = _3PP;
        playerDetails.MIN = MIN;
        playerDetails.PTS = PTS;
        playerDetails.REB = REB;
        playerDetails.AST = AST;
        playerDetails.STL = STL;
        playerDetails.BLK = BLK;
        playerDetails.TOV = TOV;
        playerDetails.PF = PF;
        playerDetails.PM = PM;
        playerDetails.lastSyncAt = new Date();
        try {
            await playerDetails.save();
        }
        catch (error) {
            if (Number(error.code) === 23505) {
                throw new common_1.ConflictException('Player Details already exists');
            }
            else {
                this.logger.log(error);
                throw new common_1.InternalServerErrorException();
            }
        }
        return playerDetails;
    }
    async getPlayersDetails(filterDto) {
        const { name, search, names, GP, WP, MPG, PPG, RPG, APG, SPG, BPG, TPG, FGM, FGA, FGP, FTM, FTA, FTP, _3PM, _3PA, _3PP, MIN, PTS, REB, AST, STL, BLK, TOV, PF, PM, } = filterDto;
        const table_name = 'player-details';
        const query = this.createQueryBuilder(table_name);
        if (search)
            query.where(`(${table_name}.name LIKE :search)`, {
                search: `%${search}%`,
            });
        if (name)
            query.andWhere(`${table_name}.name = :name`, { name });
        if (GP)
            query.andWhere(`${table_name}.GP >= :GP`, { GP });
        if (WP)
            query.andWhere(`${table_name}.WP >= :WP`, { WP });
        if (MPG)
            query.andWhere(`${table_name}.MPG >= :MPG`, { MPG });
        if (PPG)
            query.andWhere(`${table_name}.PPG >= :PPG`, { PPG });
        if (RPG)
            query.andWhere(`${table_name}.RPG >= :RPG`, { RPG });
        if (APG)
            query.andWhere(`${table_name}.APG >= :APG`, { APG });
        if (SPG)
            query.andWhere(`${table_name}.SPG >= :SPG`, { SPG });
        if (BPG)
            query.andWhere(`${table_name}.BPG >= :BPG`, { BPG });
        if (TPG)
            query.andWhere(`${table_name}.TPG >= :TPG`, { TPG });
        if (FGM)
            query.andWhere(`${table_name}.FGM >= :FGM`, { FGM });
        if (FGA)
            query.andWhere(`${table_name}.FGA >= :FGA`, { FGA });
        if (FGP)
            query.andWhere(`${table_name}.FGP >= :FGP`, { FGP });
        if (FTM)
            query.andWhere(`${table_name}.FTM >= :FTM`, { FTM });
        if (FTA)
            query.andWhere(`${table_name}.FTA >= :FTA`, { FTA });
        if (FTP)
            query.andWhere(`${table_name}.FTP >= :FTP`, { FTP });
        if (_3PM)
            query.andWhere(`${table_name}._3PM >= :_3PM`, { _3PM });
        if (_3PA)
            query.andWhere(`${table_name}._3PA >= :_3PA`, { _3PA });
        if (_3PP)
            query.andWhere(`${table_name}._3PP >= :_3PP`, { _3PP });
        if (MIN)
            query.andWhere(`${table_name}.MIN >= :MIN`, { MIN });
        if (PTS)
            query.andWhere(`${table_name}.PTS >= :PTS`, { PTS });
        if (REB)
            query.andWhere(`${table_name}.REB >= :REB`, { REB });
        if (AST)
            query.andWhere(`${table_name}.AST >= :AST`, { AST });
        if (STL)
            query.andWhere(`${table_name}.STL >= :STL`, { STL });
        if (BLK)
            query.andWhere(`${table_name}.BLK >= :BLK`, { BLK });
        if (TOV)
            query.andWhere(`${table_name}.TOV >= :TOV`, { TOV });
        if (PF)
            query.andWhere(`${table_name}.PF >= :PF`, { PF });
        if (PM)
            query.andWhere(`${table_name}.PM >= :PM`, { PM });
        if (names && names.split(',').length > 0) {
            const options = [];
            const values = {};
            names.split(',').forEach((name, idx) => {
                const key = 'name' + idx;
                options.push(`(${table_name}.name = :` + key + ')');
                values[key] = name;
            });
            query.andWhere('(' + options.join(' OR ') + ')', values);
        }
        try {
            const players = await query.getMany();
            players.forEach((player) => {
                player['PFP'] =
                    player.GP && player.GP > 0 ? (player.PF / player.GP).toFixed(2) : 0;
                player['PMP'] =
                    player.GP && player.GP > 0 ? (player.PM / player.GP).toFixed(2) : 0;
            });
            return players;
        }
        catch (error) {
            this.logger.error(`Failed to get players . Filters: ${JSON.stringify(filterDto)}"`, error.stack);
            throw new common_1.InternalServerErrorException();
        }
    }
};
PlayerDetailsRepository = __decorate([
    typeorm_1.EntityRepository(player_details_entity_1.PlayerDetails)
], PlayerDetailsRepository);
exports.PlayerDetailsRepository = PlayerDetailsRepository;
//# sourceMappingURL=player-details.repository.js.map