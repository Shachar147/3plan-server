import { Module } from '@nestjs/common';
import { BackupsService } from './backups.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {BackupsRepository} from "./backups.repository";
import {BackupsController} from "./backups.controller";

@Module({
  imports: [TypeOrmModule.forFeature([BackupsRepository])],
  controllers: [BackupsController],
  providers: [BackupsService],
  exports: [BackupsService]
})
export class BackupsModule {}
