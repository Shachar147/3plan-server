import {EntityRepository, getRepository, Repository} from "typeorm";
import {
    Injectable,
    Logger,
} from "@nestjs/common";
import { User } from "../user/user.entity";
import {History} from "./history.entity";
import {CreateHistoryDto} from "./dto/create-history-dto";
import {Trip} from "../trip/trip.entity";

@Injectable()
@EntityRepository(History)
export class HistoryRepository extends Repository<History> {
    private logger = new Logger("HistoryRepository");

    private MAX_HISTORY_PER_TRIP = 500;

    public async removeOldHistory(tripId: number) {
        const allHistory = (await this.find({
            tripId
        })).sort((a,b) => a.id - b.id);
        const deleteIds = [];
        if (allHistory.length >= this.MAX_HISTORY_PER_TRIP){
            const deleteCount = (allHistory.length - this.MAX_HISTORY_PER_TRIP) + 1;
            for (let i = 0; i < deleteCount; i++) {
                deleteIds.push(allHistory[i].id);
            }
        }

        let deleted = 0;
        for (let i = 0; i < deleteIds.length; i++) {
            await this.delete({
                id: deleteIds[i]
            })
            deleted++;
        }

        return deleted;
    }

    public async createHistory(createHistoryDto: CreateHistoryDto, user: User): Promise<History> {
        let { tripId } = createHistoryDto;
        const {
            eventId,
            eventName,
            action,
            actionParams
        } = createHistoryDto;

        // @ts-ignore
        if (tripId == 0 && actionParams.tripName) {

            const tripRepository = getRepository(Trip);
            const trip = await tripRepository
                .createQueryBuilder('trip')
                .where('trip.name = :name', { name: actionParams["tripName"] })
                .getOne();

            if (trip){
                tripId = trip.id;
            }
        }

        await this.removeOldHistory(tripId);

        const backup = new History();
        backup.tripId = tripId;
        backup.eventId = eventId;
        backup.eventName = eventName;
        backup.action = action;
        backup.actionParams = actionParams;
        backup.updatedBy = user;

        try {
            await backup.save();
        } catch (error) {
            console.error("failed to save history");
            throw error;
        }

        return backup;
    }


}
