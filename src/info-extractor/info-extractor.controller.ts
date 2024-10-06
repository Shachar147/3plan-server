import {
    Body,
    Controller,
    Logger,
    Post,
    UnauthorizedException,
    UseGuards,
    ValidationPipe
} from '@nestjs/common';
import {InfoExtractorService} from "./info-extractor.service";
import {ExtractInfoDto} from "./dto/extract-info.dto";
import {ApiBearerAuth} from "@nestjs/swagger";
import {AuthGuard} from "@nestjs/passport";
import {GetUser} from "../auth/get-user.decorator";
import {User} from "../user/user.entity";

@ApiBearerAuth('JWT')
@Controller('info-extractor')
export class InfoExtractorController {
    private logger = new Logger("InfoExtractorController");

    constructor(private readonly infoExtractorService: InfoExtractorService) {}

    @Post()
    @UseGuards(AuthGuard())
    async extractInfo(
        @Body(ValidationPipe) extractInfoDto: ExtractInfoDto,
        @GetUser() user: User
    ) {
        if (user.username != 'Shachar') {
            throw new UnauthorizedException('Cannot perform this action');
        }
        return await this.infoExtractorService.extractInfo(extractInfoDto);
    }
}
