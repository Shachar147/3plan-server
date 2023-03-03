import {Injectable} from '@nestjs/common';
import {InjectRepository} from "@nestjs/typeorm";
import {BackupsRepository} from "./backups.repository";
import {CreateBackupDto} from "./dto/create-backup-dto";
import {User} from "../user/user.entity";
import {Backups} from "./backups.entity";

@Injectable()
export class BackupsService {
    constructor(
        @InjectRepository(BackupsRepository)
        private backupsRepository: BackupsRepository,
    ) {}

    async createBackup(createBackupDto: CreateBackupDto, user: User): Promise<Backups> {
        return this.backupsRepository.createBackup(createBackupDto, user)
    }
}
