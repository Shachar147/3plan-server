import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {HistoryRepository} from "./history.repository";
import {HistoryController} from "./history.controller";
import {AuthModule} from "../auth/auth.module";
import {PassportModule} from "@nestjs/passport";

@Module({
  imports: [
    TypeOrmModule.forFeature([HistoryRepository]),
    AuthModule,
    PassportModule,
  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService]
})
export class HistoryModule {}
