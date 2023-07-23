import {
    IsBoolean,
    IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePermissionDto {
    @ApiProperty({ required: true })
    @IsNotEmpty({
        message: 'missing: canWrite',
    })
    @IsBoolean()
    canWrite: boolean;
}
