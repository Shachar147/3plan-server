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
        const data = await this.backupsRepository.find({
            tripId: getTripBackupsDto.trip_id
        });
        return {
            total: data.length,
            backups: data
        }
    }

    async getAllBackups(user: User): Promise<{
        total: number,
        backups: Backups[]
    }> {
        const data = await this.backupsRepository.find({});
        return {
            total: data.length,
            backups: data
        }
    }
}
