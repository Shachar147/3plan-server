import { EntityRepository, Repository } from "typeorm";
import {
    Logger,
} from "@nestjs/common";
import { User } from "../user/user.entity";
import {History} from "./history.entity";
import {CreateHistoryDto} from "./dto/create-history-dto";

@EntityRepository(History)
export class HistoryRepository extends Repository<History> {
    private logger = new Logger("HistoryRepository");

    // todo change
    private MAX_BACKUPS = 1000;

    public async removeOldHistory() {
        const allHistory = (await this.find({})).sort((a,b) => a.id - b.id);
        const deleteIds = [];
        if (allHistory.length >= this.MAX_BACKUPS){
            const deleteCount = (allHistory.length - this.MAX_BACKUPS) + 1;
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
        const {
            tripId,
            eventId,
            eventName,
            action,
            actionParams
        } = createHistoryDto;

        await this.removeOldHistory();

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
