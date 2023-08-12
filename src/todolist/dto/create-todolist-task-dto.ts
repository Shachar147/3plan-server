import {
  IsEnum,
  IsNotEmpty, IsNumber, IsOptional, IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TodolistTaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  CANCELLED = 'CANCELLED',
  DONE = 'DONE'
}

export class CreateTodolistTaskDto {
  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: tripId',
  })
  tripId: number;

  @IsString()
  @ApiProperty({ required: true })
  @IsNotEmpty({
    message: 'missing: title',
  })
  title: string;

  @IsNotEmpty({
    message: 'missing: status',
  })
  @IsEnum(TodolistTaskStatus)
  status: TodolistTaskStatus;

  @IsNumber()
  @ApiProperty({ required: false, default: null })
  @IsOptional()
  eventId: number;

  @IsString()
  @ApiProperty({ required: false, default: null })
  @IsOptional()
  content: string;

  @IsNumber()
  @ApiProperty({ type: 'bigint', required: false, default: null })
  @IsOptional()
  mustBeDoneBefore: number;
}
