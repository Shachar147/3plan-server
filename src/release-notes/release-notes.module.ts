import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReleaseNote } from './release-notes.entity';
import { ReleaseNotesService } from './release-notes.service';
import { ReleaseNotesController } from './release-notes.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ReleaseNote])],
  controllers: [ReleaseNotesController],
  providers: [ReleaseNotesService],
  exports: [ReleaseNotesService],
})
export class ReleaseNotesModule {}

