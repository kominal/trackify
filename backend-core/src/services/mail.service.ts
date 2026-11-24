import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { Attachment } from 'nodemailer/lib/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  public constructor(private readonly mailerService: MailerService) {}

  public async sendMail(to: string | string[], subject: string, html: string, attachments?: Attachment[]): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        from: '"Kominal Trackify" <noreply@kominal.com>',
        subject,
        html,
        attachments,
      });
      // Log metadata only — never recipients' addresses, subjects or bodies.
      this.logger.log(`Mail sent (recipients: ${Array.isArray(to) ? to.length : 1})`);
    } catch (e) {
      this.logger.error('Failed to send mail', e instanceof Error ? e.stack : String(e));
    }
  }
}
