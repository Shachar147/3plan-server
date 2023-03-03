import { Module } from '@nestjs/common';
import { BackupsService } from './backups.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {BackupsRepository} from "./backups.repository";

@Module({
  imports: [TypeOrmModule.forFeature([BackupsRepository])],
  providers: [BackupsService],
  exports: [BackupsService]
})
export class BackupsModule {}
