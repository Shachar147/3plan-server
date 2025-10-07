import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReleaseNote } from './release-notes.entity';
import { CreateReleaseNoteDto } from './dto/create-release-note-dto';
import { UpdateReleaseNoteDto } from './dto/update-release-note-dto';

@Injectable()
export class ReleaseNotesService {
  constructor(
    @InjectRepository(ReleaseNote)
    private repo: Repository<ReleaseNote>
  ) {}

  create(dto: CreateReleaseNoteDto) {
    const entity = this.repo.create({ ...dto });
    return this.repo.save(entity);
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number) {
    const note = await this.repo.findOne({ where: { id } });
    if (!note) throw new NotFoundException('Release note not found');
    return note;
  }

  async update(id: number, dto: UpdateReleaseNoteDto) {
    await this.repo.update({ id }, { ...dto });
    return this.findOne(id);
  }

  async remove(id: number) {
    const res = await this.repo.delete({ id });
    if (!res.affected) throw new NotFoundException('Release note not found');
    return { affected: res.affected };
  }
}

