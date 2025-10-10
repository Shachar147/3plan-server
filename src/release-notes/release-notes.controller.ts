import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ReleaseNotesService } from './release-notes.service';
import { CreateReleaseNoteDto } from './dto/create-release-note-dto';
import { UpdateReleaseNoteDto } from './dto/update-release-note-dto';

@ApiBearerAuth('JWT')
@Controller('release-notes')
export class ReleaseNotesController {
  constructor(private service: ReleaseNotesService) {}

  @ApiOperation({ summary: 'Create release note' })
  @Post()
  @UseGuards(AuthGuard())
  create(@Body(ValidationPipe) dto: CreateReleaseNoteDto) {
    return this.service.create(dto);
  }

  @ApiOperation({ summary: 'List release notes' })
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @ApiOperation({ summary: 'Get release note by id' })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @ApiOperation({ summary: 'Update release note' })
  @Patch(':id')
  @UseGuards(AuthGuard())
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) dto: UpdateReleaseNoteDto
  ) {
    return this.service.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete release note' })
  @Delete(':id')
  @UseGuards(AuthGuard())
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}

