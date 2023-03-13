import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {BackupsRepository} from "./backups.repository";
import {CreateBackupDto} from "./dto/create-backup-dto";
import {User} from "../user/user.entity";
import {Backups} from "./backups.entity";
import {GetTripBackupsDto} from "./dto/get-trip-backups-dto";

@Injectable()
export class BackupsService {
    constructor(
        @InjectRepository(BackupsRepository)
        private backupsRepository: BackupsRepository,
    ) {}

    async createBackup(createBackupDto: CreateBackupDto, user: User): Promise<Backups> {
        return this.backupsRepository.createBackup(createBackupDto, user)
    }

    async getTripBackups(getTripBackupsDto: GetTripBackupsDto, user: User): Promise<{
        total: number,
        backups: Backups[]
    }> {
        const { trip_id, limit = 20 } = getTripBackupsDto;
        let data = await this.backupsRepository.find({
            tripId: trip_id
        });
        data = data.sort((a,b) => b.id - a.id);
        return {
            total: data.length,
            backups: data.slice(0, Math.min(data.length-1, limit))
        }
    }

    async getAllBackups(user: User): Promise<{
        total: number,
        backups?: Backups[]
    }> {
        let data = await this.backupsRepository.find({});
        data = data.sort((a,b) => b.id - a.id);
        return {
            total: data.length
            // backups: data
        }
    }
}
