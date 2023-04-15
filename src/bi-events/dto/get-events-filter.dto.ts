import {IsOptional} from "class-validator";

export class GetEventsFilterDto {
    @IsOptional()
    action: string;

    @IsOptional()
    context: string;

    @IsOptional()
    isMobile: boolean;

    @IsOptional()
    includePrice: boolean;
}