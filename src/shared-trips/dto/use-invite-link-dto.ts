import {
    IsNotEmpty,
    IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UseInviteLinkDto {
    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: token',
    })
    @IsString()
    token: string;
}
