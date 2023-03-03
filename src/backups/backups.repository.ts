import { EntityRepository, Repository } from "typeorm";
import {
    Logger,
} from "@nestjs/common";
import { User } from "../user/user.entity";
import {Backups} from "./backups.entity";
import {CreateBackupDto} from "./dto/create-backup-dto";

@EntityRepository(Backups)
export class BackupsRepository extends Repository<Backups> {
    private logger = new Logger("BackupsRepository");

    private MAX_BACKUPS = 270;

    public async removeOldBackups() {
        const allBackups = (await this.find({})).sort((a,b) => a.id - b.id);
        const deleteIds = [];
        if (allBackups.length >= this.MAX_BACKUPS){
            const deleteCount = (allBackups.length - this.MAX_BACKUPS) + 1;
            for (let i = 0; i < deleteCount; i++) {
                deleteIds.push(allBackups[i].id);
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

    public async createBackup(createBackupDto: CreateBackupDto, user: User): Promise<Backups> {
        const {
            tripBackup,
            tripId,
            requestMethod,
            requestPayload,
            requestUrl
        } = createBackupDto;

        await this.removeOldBackups();

        const backup = new Backups();
        backup.tripBackup = tripBackup;
        backup.tripId = tripId;
        backup.requestMethod = requestMethod;
        backup.requestPayload = requestPayload;
        backup.requestUrl = requestUrl;

        backup.updatedBy = user;

        try {
            await backup.save();
        } catch (error) {
            console.error("failed to save backup");
            throw error;
        }

        return backup;
    }


}
