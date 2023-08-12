import {
    IsEnum,
    IsNumber, IsOptional, IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {TodolistTaskStatus} from "./create-todolist-task-dto";

export class UpdateTodolistTaskDto {
    @IsOptional()
    @IsString()
    @ApiProperty({ required: true })
    title: string;

    @IsOptional()
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
