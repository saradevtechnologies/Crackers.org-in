import 'server-only';

/**
 * Delivers the 6-digit step-up code used in bulk-buyer password resets.
 *   OTP_SENDER=whatsapp  WhatsApp Cloud API "authentication" template (WHATSAPP_AUTH_TEMPLATE_NAME)
 *   OTP_SENDER=msg91     MSG91 OTP API (MSG91_AUTH_KEY, MSG91_OTP_TEMPLATE_ID)
 *   OTP_SENDER=console   prints the code in the server log. Development only; refused in production.
 * Hashing, expiry and attempt rules live in otp-core.ts.
 */
export type OtpSender = 'console' | 'whatsapp' | 'msg91';

export function otpSender(): OtpSender {
  const v = (process.env.OTP_SENDER || '').toLowerCase();
  if (v === 'whatsapp' || v === 'msg91' || v === 'console') return v;
  return 'console';
}

/** `phone` is E.164 (+91…). Throws with a safe message if sending fails. */
export async function sendOtp(phone: string, code: string) {
  const sender = otpSender();
  const digits = phone.replace(/\D/g, '');

  if (sender === 'console') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('OTP_SENDER is not configured for production (set it to whatsapp or msg91).');
    }
    // Development only: the one place a phone number and code are logged.
    console.info(`[otp-sender:console] code ${code} for ******${digits.slice(-4)}`);
    return;
  }

  if (sender === 'whatsapp') {
    const token = process.env.WHATSAPP_CLOUD_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const template = process.env.WHATSAPP_AUTH_TEMPLATE_NAME;
    if (!token || !phoneId || !template) throw new Error('WhatsApp OTP is not configured.');
    const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: digits,
        type: 'template',
        template: {
          name: template,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
          // Authentication templates take the code in the body and in the copy-code button.
          components: [
            { type: 'body', parameters: [{ type: 'text', text: code }] },
            { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
          ],
        },
      }),
    });
    if (!res.ok) throw new Error(`WhatsApp OTP failed (${res.status}).`);
    return;
  }

  // msg91
  const key = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_OTP_TEMPLATE_ID;
  if (!key || !templateId) throw new Error('MSG91 OTP is not configured.');
  const url = new URL('https://control.msg91.com/api/v5/otp');
  url.searchParams.set('template_id', templateId);
  url.searchParams.set('mobile', digits);
  url.searchParams.set('otp', code);
  url.searchParams.set('otp_expiry', '10');
  const res = await fetch(url, { method: 'POST', headers: { authkey: key, 'Content-Type': 'application/json' }, body: '{}' });
  const json = (await res.json().catch(() => ({}))) as { type?: string };
  if (!res.ok || json.type === 'error') throw new Error(`MSG91 OTP failed (${res.status}).`);
}
