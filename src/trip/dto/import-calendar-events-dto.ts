import {
    IsNotEmpty, IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ImportCalendarEventsDto {
    @ApiProperty({ required: true })
    @IsOptional()
    @IsNotEmpty({
        message: 'missing: calendarEvents',
    })
    calendarEvents: any;
}
