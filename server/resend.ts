import { Resend } from 'resend';

export async function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com';

  return {
    client: new Resend(apiKey),
    fromEmail,
  };
}
