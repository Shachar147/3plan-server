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

    public async createBackup(createBackupDto: CreateBackupDto, user: User): Promise<Backups> {
        const {
            tripBackup,
            tripId,
            requestMethod,
            requestPayload,
            requestUrl
        } = createBackupDto;
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
