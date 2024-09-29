import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import {Injectable, Logger} from '@nestjs/common';
import * as path from 'path';
import * as mime from 'mime-types';


@Injectable()
export class FileUploadService {
    private s3Client: S3Client;
    private bucketName = process.env.AWS_S3_BUCKET_NAME; // Set this in your .env file
    private logger = new Logger("FileUploadController");

    constructor() {
        this.s3Client = new S3Client({
            region: process.env.AWS_REGION, // Set your AWS region in .env
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Set in .env
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Set in .env
            },
        });
    }

    async uploadFile(file): Promise<string> {
        this.logger.log('reached FileUploadService::uploadFile');
        const fileName = this.sanitizeFileName(file.originalname); // Sanitize file name
        this.logger.log('sanitized file name');
        const fileExtension = path.extname(file.originalname); // Get the file extension
        const mimeType = mime.lookup(fileExtension); // Get MIME type
        this.logger.log(`extracted file extension and mimeType: ${fileExtension}; ${mimeType}`);

        // Prepare S3 upload parameters
        const uploadParams = {
            Bucket: this.bucketName, // Your bucket name
            Key: `images/pois/${fileName}`, // The file path in S3
            Body: file.buffer, // File content
            ContentType: mimeType || 'application/octet-stream', // File type
            // ACL: ObjectCannedACL.aws_exec_read, // Use the enum for ACL
        };

        this.logger.log(`built s3 upload params: ${JSON.stringify({
            ...uploadParams,
            Body: '***File***'
        })}`);

        try {
            this.logger.log('Trying to upload to s3....');

            // Upload to S3
            const data = await this.s3Client.send(new PutObjectCommand(uploadParams));
            // console.log('File uploaded successfully:', data);

            this.logger.log('Upload finished successfully!');

            // Return the S3 URL of the uploaded file
            return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/images/pois/${fileName}`;
        } catch (error) {
            console.error('Error uploading file:', error);

            this.logger.error('Upload failed :(');

            throw new Error('File upload failed');
        }
    }

    private sanitizeFileName(fileName: string): string {
        return fileName.replace(/[^a-zA-Z0-9.-]/g, '-'); // Replace invalid characters with '-'
    }
}