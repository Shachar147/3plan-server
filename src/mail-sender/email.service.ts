import { Injectable } from '@nestjs/common';

// @ts-ignore
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter;

    constructor() {
        // Create a transporter
        this.transporter = nodemailer.createTransport({
            // service: 'gmail',
            host: 'smtp.gmail.com',
            port: 465,
            ignoreTLS: true,
            secure: true,
            auth: {
                user: 'triplan.team@gmail.com',
                pass: 'Aa200993',
            },
        });
    }

    async sendEmail(to: string, subject: string, html: string) {
        try {
            // Send email
            await this.transporter.sendMail({
                from: 'your-email@gmail.com',
                to: to,
                subject: subject,
                html: html,
            });
            console.log('Email sent successfully');
        } catch (error) {
            console.error('Failed to send email', error);
        }
    }
}
