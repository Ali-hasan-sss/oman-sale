import nodemailer from 'nodemailer';

import { env } from '../../config/env';
import { ApiError } from '../utils/api-error';

type EmailLocale = 'ar' | 'en';
type EmailKind = 'verify-email' | 'reset-password';

const buildHtml = (kind: EmailKind, code: string, locale: EmailLocale) => {
  const isAr = locale === 'ar';
  const title = isAr
    ? kind === 'verify-email'
      ? 'تأكيد البريد الإلكتروني'
      : 'إعادة تعيين كلمة المرور'
    : kind === 'verify-email'
      ? 'Verify your email'
      : 'Reset your password';
  const intro = isAr
    ? kind === 'verify-email'
      ? 'استخدم الرمز التالي لتأكيد بريدك الإلكتروني في Oman Sale.'
      : 'استخدم الرمز التالي لإعادة تعيين كلمة المرور.'
    : kind === 'verify-email'
      ? 'Use the code below to verify your Oman Sale email.'
      : 'Use the code below to reset your password.';
  const note = isAr ? 'ينتهي هذا الرمز خلال 10 دقائق.' : 'This code expires in 10 minutes.';

  return `<!doctype html>
<html lang="${locale}" dir="${isAr ? 'rtl' : 'ltr'}">
  <body style="margin:0;background:#f8fafc;font-family:Arial,Tahoma,sans-serif;color:#0f172a;">
    <table width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;background:#f8fafc;">
      <tr><td align="center">
        <table width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:white;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0;">
          <tr><td style="background:#0f766e;padding:28px;text-align:center;color:white;">
            <h1 style="margin:0;font-size:26px;">Oman Sale</h1>
            <p style="margin:8px 0 0;opacity:.9;">${title}</p>
          </td></tr>
          <tr><td style="padding:32px;text-align:center;">
            <h2 style="margin:0 0 12px;font-size:22px;">${title}</h2>
            <p style="margin:0 0 24px;color:#475569;line-height:1.7;">${intro}</p>
            <div style="direction:ltr;letter-spacing:10px;font-size:34px;font-weight:900;color:#0f766e;background:#ecfdf5;border:1px solid #99f6e4;border-radius:16px;padding:18px 12px;">${code}</div>
            <p style="margin:24px 0 0;color:#64748b;font-size:14px;">${note}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
};

export const sendAuthCodeEmail = async (to: string, code: string, kind: EmailKind, locale: EmailLocale) => {
  if (env.EMAIL_SKIP_SEND) return;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    throw new ApiError(500, 'Email service is not configured');
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject:
      locale === 'ar'
        ? kind === 'verify-email'
          ? 'رمز تأكيد البريد الإلكتروني - Oman Sale'
          : 'رمز إعادة تعيين كلمة المرور - Oman Sale'
        : kind === 'verify-email'
          ? 'Verify your email - Oman Sale'
          : 'Reset your password - Oman Sale',
    html: buildHtml(kind, code, locale)
  });
};
