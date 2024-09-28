import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {getFrontendAddress} from "../config/server.config";

@Injectable()
export class FileUploadService {
    async uploadFile(file): Promise<string> {
        const uploadPath = path.join(getFrontendAddress(), 'images', 'pois'); // Adjust the path as necessary

        const fileName = this.sanitizeFileName(file.originalname);
        const filePath = path.join(uploadPath, fileName);

        // Save the file to the filesystem
        if (!fs.existsSync(filePath)) {
            await fs.promises.writeFile(filePath, file.buffer);
        }
        return `/images/pois/${fileName}`;
    }

    async uploadFiles(files): Promise<string[]> {
        const uploadPath = path.join(__dirname, '..', '..', 'public', 'images', 'pois'); // Adjust the path as necessary
        const uploadedFiles: string[] = [];

        for (const file of files) {
            const fileName = this.sanitizeFileName(file.originalname);
            const filePath = path.join(uploadPath, fileName);

            // Save the file to the filesystem
            await fs.promises.writeFile(filePath, file.buffer);
            uploadedFiles.push(`/images/pois/${fileName}`); // Return the relative path
        }

        return uploadedFiles;
    }

    private sanitizeFileName(originalName: string): string {
        return originalName.replace(/[^a-zA-Z0-9-_.]/g, '-').toLowerCase(); // Sanitize the file name
    }
}
