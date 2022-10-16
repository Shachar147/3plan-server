import { Repository } from 'typeorm';
import { PlayerDetails } from './player-details.entity';
import { ListPlayerDetailsDto } from './dto/list-player-details-dto';
import { CreatePlayerDetailsDto } from './dto/create-player-details-dto';
export declare class PlayerDetailsRepository extends Repository<PlayerDetails> {
    private logger;
    createPlayerDetails(createPlayerDto: CreatePlayerDetailsDto): Promise<PlayerDetails>;
    getPlayersDetails(filterDto: ListPlayerDetailsDto): Promise<PlayerDetails[]>;
}
