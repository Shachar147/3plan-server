import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import * as mime from 'mime-types';
import * as AWS from 'aws-sdk';

function loadEnv() {
    const envFilePath = path.resolve(__dirname, '../../.env');

    if (process.env.NODE_ENV === 'development' && fs.existsSync(envFilePath)) {
        const envFileContent = fs.readFileSync(envFilePath, 'utf8');
        const envVars = envFileContent.split('\n');

        envVars.forEach((line) => {
            const [key, value] = line.split('=');
            if (key && value) {
                process.env[key.trim()] = value.trim();
            }
        });
    }
}

@Injectable()
export class FileUploadService {
    private s3: AWS.S3;
    private bucketName = process.env.AWS_S3_BUCKET_NAME;
    private logger = new Logger('FileUploadService');

    constructor() {
        loadEnv();
        this.bucketName = process.env.AWS_S3_BUCKET_NAME;

        // Configure AWS SDK with your credentials and region
        AWS.config.update({
            region: process.env.AWS_REGION,
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        });

        this.s3 = new AWS.S3();
    }

    async uploadBuffer(buffer: Buffer, fileName: string, contentType?: string): Promise<string> {
        const sanitized = this.sanitizeFileName(fileName);
        const fileExtension = path.extname(sanitized);
        const mimeType = contentType || (fileExtension ? mime.lookup(fileExtension) || undefined : undefined);

        const key = `images/event-images/${sanitized}`;
        const uploadParams = {
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: mimeType || 'application/octet-stream',
        } as AWS.S3.PutObjectRequest;

        try {
            const data = await this.s3.upload(uploadParams).promise();
            return this.getPublicUrlForKey(key);
        } catch (error) {
            this.logger.error('uploadBuffer failed', error as any);
            throw new Error('File upload failed');
        }
    }

    async uploadBufferWithKey(buffer: Buffer, key: string, contentType?: string): Promise<string> {
        const uploadParams = {
            Bucket: this.bucketName,
            Key: key,
            Body: buffer,
            ContentType: contentType || 'application/octet-stream',
        } as AWS.S3.PutObjectRequest;

        try {
            const data = await this.s3.upload(uploadParams).promise();
            return this.getPublicUrlForKey(key);
        } catch (error) {
            this.logger.error('uploadBufferWithKey failed', error as any);
            throw new Error('File upload failed');
        }
    }

    async exists(key: string): Promise<boolean> {
        try {
            await this.s3.headObject({ Bucket: this.bucketName!, Key: key }).promise();
            return true;
        } catch (e) {
            return false;
        }
    }

    async uploadBufferIfNotExists(buffer: Buffer, key: string, contentType?: string): Promise<string> {
        const alreadyExists = await this.exists(key);
        if (alreadyExists) {
            return this.getPublicUrlForKey(key);
        }
        return this.uploadBufferWithKey(buffer, key, contentType);
    }

    getPublicUrlForKey(key: string): string {
        return `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    }

    async uploadFile(file): Promise<string> {
        console.log('Reached FileUploadService::uploadFile');
        const fileName = this.sanitizeFileName(file.originalname);
        const fileExtension = path.extname(file.originalname);
        const mimeType = mime.lookup(fileExtension);

        console.log(`Extracted file extension and MIME type: ${fileExtension}; ${mimeType}`);

        // Prepare S3 upload parameters
        const uploadParams = {
            Bucket: this.bucketName,
            Key: `images/pois/${fileName}`,
            Body: file.buffer,
            ContentType: mimeType || 'application/octet-stream',
        };

        console.log(`Built S3 upload params: ${JSON.stringify({
            ...uploadParams,
            Body: '***File***',
        })}`);

        try {
            console.log('Trying to upload to S3...');

            // Upload to S3
            const data = await this.s3.upload(uploadParams).promise();
            console.log('Upload finished successfully!');

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