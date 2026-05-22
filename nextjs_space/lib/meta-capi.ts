import crypto from 'crypto';

const PIXEL_ID = '1457902812314050';
const CAPI_URL = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

export function generateEventId(): string {
  return crypto.randomUUID();
}

interface CapiEventOptions {
  eventName: string;
  email: string;
  eventId: string;
  sourceUrl: string;
  customData?: Record<string, unknown>;
}

export async function sendCapiEvent(opts: CapiEventOptions): Promise<void> {
  const token = process.env.META_CAPI_TOKEN;
  if (!token) {
    console.warn('[Meta CAPI] META_CAPI_TOKEN não configurado — evento ignorado');
    return;
  }

  const payload = {
    data: [
      {
        event_name: opts.eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: opts.eventId,
        action_source: 'website',
        event_source_url: opts.sourceUrl,
        user_data: {
          em: hashEmail(opts.email),
        },
        ...(opts.customData ? { custom_data: opts.customData } : {}),
      },
    ],
    access_token: token,
  };

  try {
    const res = await fetch(CAPI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('[Meta CAPI] Erro:', res.status, text);
    } else {
      console.log(`[Meta CAPI] ${opts.eventName} enviado (event_id: ${opts.eventId})`);
    }
  } catch (err) {
    console.error('[Meta CAPI] Erro de rede:', err);
  }
}
