import {Controller, Post, UploadedFile, UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';

@Controller('file-upload')
export class FileUploadController {
    constructor(private readonly fileUploadService: FileUploadService) {}

    @Post()
    @UseInterceptors(FileInterceptor('file')) // 'file' should match the name in FormData
    async uploadFiles(@UploadedFile() file) {
        const uploadedFile = await this.fileUploadService.uploadFile(file);
        return { message: 'File uploaded successfully', file: uploadedFile };
    }
}
