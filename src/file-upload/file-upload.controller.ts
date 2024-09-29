import {Controller, Logger, Post, UploadedFile, UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';

@Controller('file-upload')
export class FileUploadController {
    private logger = new Logger("FileUploadController");

    constructor(private readonly fileUploadService: FileUploadService) {}

    @Post()
    @UseInterceptors(FileInterceptor('file')) // 'file' should match the name in FormData
    async uploadFiles(@UploadedFile() file) {
        this.logger.log('reached FileUploadController');
        const uploadedFile = await this.fileUploadService.uploadFile(file);
        return { message: 'File uploaded successfully', file: uploadedFile };
    }
}
