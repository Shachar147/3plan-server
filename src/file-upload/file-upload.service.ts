import { S3Client, PutObjectCommand, ObjectCannedACL } from '@aws-sdk/client-s3';
import {Injectable, Logger} from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as mime from 'mime-types';

function loadEnv() {
    // Only load .env in local development environments (like NODE_ENV=development)
    const envFilePath = path.resolve(__dirname, '../../.env');

    // Check if .env exists
    const mode = process.env.NODE_ENV;
    if (mode && mode.trim() === 'development' && fs.existsSync(envFilePath)) {
        const envFileContent = fs.readFileSync(envFilePath, 'utf8');
        const envVars = envFileContent.split('\n');

        envVars.forEach((line) => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim(); // Set process.env if not already set
            }
        });
    }
}

@Injectable()
export class FileUploadService {
    private s3Client: S3Client;
    private bucketName = process.env.AWS_S3_BUCKET_NAME; // Set this in your .env file
    private logger = new Logger("FileUploadController");

    constructor() {
        loadEnv();
        this.bucketName = process.env.AWS_S3_BUCKET_NAME;
        const region = process.env.AWS_REGION;
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

        this.s3Client = new S3Client({
            region: region, // Set your AWS region in .env
            credentials: {
                accessKeyId, // Set in .env
                secretAccessKey, // Set in .env
            },
        });
    }

    async uploadFile(file): Promise<string> {
        const region = process.env.AWS_REGION;

        console.log('reached FileUploadService::uploadFile');
        const fileName = this.sanitizeFileName(file.originalname); // Sanitize file name
        console.log('sanitized file name');
        const fileExtension = path.extname(file.originalname); // Get the file extension
        const mimeType = mime.lookup(fileExtension); // Get MIME type
        console.log(`extracted file extension and mimeType: ${fileExtension}; ${mimeType}`);

        // Prepare S3 upload parameters
        const uploadParams = {
            Bucket: this.bucketName, // Your bucket name
            Key: `images/pois/${fileName}`, // The file path in S3
            Body: file.buffer, // File content
            ContentType: mimeType || 'application/octet-stream', // File type
            // ACL: ObjectCannedACL.aws_exec_read, // Use the enum for ACL
        };

        console.log(`built s3 upload params: ${JSON.stringify({
            ...uploadParams,
            Body: '***File***'
        })}`);

        try {
            console.log('Trying to upload to s3....');

            // Upload to S3
            const data = await this.s3Client.send(new PutObjectCommand(uploadParams));
            // console.log('File uploaded successfully:', data);

            console.log('Upload finished successfully!');

            // Return the S3 URL of the uploaded file
            return `https://${this.bucketName}.s3.${region}.amazonaws.com/images/pois/${fileName}`;
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