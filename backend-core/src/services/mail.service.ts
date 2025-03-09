import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import mjml2html from 'mjml';

const TEMPLATE = `<mjml>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-image width="100px" src="https://app.cbamfacilitator.com/assets/images/logo.png"></mj-image>
        <mj-divider border-color="#2f7774"></mj-divider>        
        <mj-text>{{TEXT1}}</mj-text>
        <mj-button background-color="#2f7774" color="white" href="{{LINK}}">
        Proceed to CBAM Facilitator
        </mj-button>
        <mj-text>{{TEXT2}}</mj-text>
        {{EXTRAS}}
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  public constructor(private mailerService: MailerService) {}

  public async sendMail(to: string | string[], subject: string, html: string): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to,
        from: '"Climate Resilience Suite" <noreply@climate-resilience-suite.com>',
        subject,
        html,
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  public async sendMailWithTemplate(to: string, subject: string, text1: string, link: string, text2?: string, extras?: string): Promise<void> {
    const html = TEMPLATE.replace('{{TEXT1}}', text1)
      .replace('{{LINK}}', link)
      .replace('{{TEXT2}}', text2 || '')
      .replace('{{EXTRAS}}', extras || '');
    await this.sendMail(to, subject, mjml2html(html).html);
  }
}
