import { Controller, Post, Body } from '@nestjs/common';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
    constructor(private emailService: EmailService) {}

    @Post('send')
    async sendEmail(@Body() emailData: { to: string, subject: string, html: string }) {
        const { to, subject, html } = emailData;
        await this.emailService.sendEmail(to, subject, html);
        return { message: 'Email sent successfully' };
    }
}
