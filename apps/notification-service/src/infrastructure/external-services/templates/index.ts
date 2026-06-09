import type { EmailTemplate } from '../../../domain/use-cases/ports';
import { renderOtpEmail } from './otp.template';

export function renderTemplate(
  template: EmailTemplate,
  data: Record<string, string>,
): { subject: string; html: string } {
  switch (template) {
    case 'otp':
      return renderOtpEmail(data);
    case 'welcome':
    case 'appointment-reminder':
      throw new Error(`Template "${template}" is not yet implemented`);
  }
}
