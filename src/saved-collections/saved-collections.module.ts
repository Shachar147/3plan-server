import { HttpModule, Module } from '@nestjs/common';
import { SavedCollectionsController } from './saved-collections.controller';
import { SavedCollectionsService } from './saved-collections.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { SavedCollectionsRepository } from './saved-collections.repository';
import {SavedCollectionsItemModule} from "./saved-collections-item/saved-collections-item.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedCollectionsRepository]),
    SavedCollectionsItemModule,
    HttpModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [SavedCollectionsController],
  providers: [SavedCollectionsService],
  exports: [SavedCollectionsService],
})
export class SavedCollectionsModule {}
