import { Module } from '@nestjs/common';
import { PackingController } from './packing.controller';
import { PackingService } from './packing.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {PackingItemRepository} from "./packing-item.repository";
import {PackingCategoryRepository} from "./packing-category.repository";
import {AuthModule} from "../auth/auth.module";
import {PassportModule} from "@nestjs/passport";

@Module({
  imports: [
    TypeOrmModule.forFeature([PackingItemRepository, PackingCategoryRepository]),
    AuthModule,
    PassportModule,
  ],
  controllers: [PackingController],
  providers: [PackingService],
  exports: [PackingService]
})
export class PackingModule {}

