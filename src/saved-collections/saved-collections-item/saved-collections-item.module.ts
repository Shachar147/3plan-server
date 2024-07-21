import { HttpModule, Module } from '@nestjs/common';
import { SavedCollectionsItemController } from './saved-collections-item.controller';
import { SavedCollectionsItemService } from './saved-collections-item.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../auth/auth.module';
import { PassportModule } from '@nestjs/passport';
import { SavedCollectionsItemRepository } from './saved-collections-item.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([SavedCollectionsItemRepository]),
    HttpModule,
    AuthModule,
    PassportModule,
  ],
  controllers: [SavedCollectionsItemController],
  providers: [SavedCollectionsItemService],
  exports: [SavedCollectionsItemService],
})
export class SavedCollectionsItemModule {}
