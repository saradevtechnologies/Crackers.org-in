import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

/** wa.me link that opens WhatsApp with the message pre-filled (manual mode). */
export function waLink(phone: string, text: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.length === 10) digits = '91' + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function whatsappMode(): 'manual' | 'cloud' {
  return process.env.WHATSAPP_MODE === 'cloud' ? 'cloud' : 'manual';
}

/**
 * Send queued notifications through the WhatsApp Cloud API.
 * In manual mode this does nothing: admins send them from the outbox.
 */
export async function flushWhatsappQueue() {
  if (whatsappMode() !== 'cloud') return;
  const token = process.env.WHATSAPP_CLOUD_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const db = createAdminClient();
  const { data: queued } = await db
    .from('notifications')
    .select('id, to_phone, template_params')
    .eq('status', 'queued')
    .order('id')
    .limit(50);

  for (const n of queued ?? []) {
    let to = String(n.to_phone).replace(/\D/g, '');
    if (to.length === 10) to = '91' + to;
    const params = (n.template_params as string[] | null) ?? [];
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'template',
          template: {
            name: process.env.WHATSAPP_TEMPLATE_NAME || 'order_update',
            language: { code: process.env.WHATSAPP_TEMPLATE_LANG || 'en' },
            components: [
              { type: 'body', parameters: params.map((p) => ({ type: 'text', text: String(p).slice(0, 900) })) },
            ],
          },
        }),
      });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      await db.from('notifications').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', n.id);
    } catch (e) {
      await db
        .from('notifications')
        .update({ status: 'failed', error: String(e).slice(0, 500) })
        .eq('id', n.id);
    }
  }
}
