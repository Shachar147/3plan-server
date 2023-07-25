import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {HistoryRepository} from "./history.repository";
import {CreateHistoryDto} from "./dto/create-history-dto";
import {User} from "../user/user.entity";
import {History} from "./history.entity";
import {GetTripHistoryDto} from "./dto/get-trip-history-dto";

@Injectable()
export class HistoryService {
    constructor(
        @InjectRepository(HistoryRepository)
        private historyRepository: HistoryRepository,
    ) {}

    async getSpecificHistory(id: number, user: User): Promise<any> {
        return await this.historyRepository.findOne({
            id
        });
    }

    async createHistory(createHistoryDto: CreateHistoryDto, user: User): Promise<History> {
        return this.historyRepository.createHistory(createHistoryDto, user)
    }

    async getTripHistory(getTripHistoryDto: GetTripHistoryDto, user: User): Promise<{
        total: number,
        history: History[]
    }> {
        const { trip_id, limit = 20 } = getTripHistoryDto;

        let data = await this.historyRepository.find({
            where: { tripId: trip_id },
            relations: ['updatedBy'], // Specify the name of the relation property
        });

        // @ts-ignore
        data = data.sort((a,b) => b.id - a.id);

        // @ts-ignore
        data.forEach((x) => x.updatedBy = x.updatedBy.username);

        return {
            total: data.length,
            history: data.length ?
                data.slice(0, Math.max(1, Math.min(data.length-1, limit))) :
                []
        }
    }

    async getAllHistory(user: User): Promise<{
        total: number,
        history?: History[]
    }> {
        let data = await this.historyRepository.find({});
        data = data.sort((a,b) => b.id - a.id);
        return {
            total: data.length
            // history: data
        }
    }
}
