import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { WebhookIntegration, WebhookLog } from '@/lib/supabase/types';

export const INITIAL_WEBHOOKS: WebhookIntegration[] = [
  {
    id: 'wh_001',
    label: 'Google Sheets — Rekap Transaksi Restoran',
    webhook_url: 'https://script.google.com/macros/s/AKfycbz_sample_endpoint_resto/exec',
    secret_token: 'asap_secret_tok_1',
    trigger_events: ['restaurant_paid', 'lodging_paid'],
    is_active: true,
    last_status_code: 200,
    last_delivery_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function getWebhooks(): Promise<WebhookIntegration[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('webhook_integrations').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as WebhookIntegration[];
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_webhooks_store');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('asap_webhooks_store', JSON.stringify(INITIAL_WEBHOOKS));
  }

  return INITIAL_WEBHOOKS;
}

export async function saveWebhook(webhook: Partial<WebhookIntegration>): Promise<WebhookIntegration> {
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = createClient();
    if (webhook.id) {
      const { data } = await supabase.from('webhook_integrations').update(webhook).eq('id', webhook.id).select().single();
      if (data) return data as WebhookIntegration;
    } else {
      const { data } = await supabase.from('webhook_integrations').insert(webhook).select().single();
      if (data) return data as WebhookIntegration;
    }
  }

  const all = await getWebhooks();
  let saved: WebhookIntegration;
  if (webhook.id) {
    saved = { ...all.find((w) => w.id === webhook.id)!, ...webhook, updated_at: new Date().toISOString() } as WebhookIntegration;
    const updated = all.map((w) => (w.id === webhook.id ? saved : w));
    if (typeof window !== 'undefined') localStorage.setItem('asap_webhooks_store', JSON.stringify(updated));
  } else {
    saved = {
      ...webhook,
      id: 'wh_' + Date.now(),
      label: webhook.label || 'Webhook Baru',
      webhook_url: webhook.webhook_url || '',
      trigger_events: webhook.trigger_events || ['restaurant_paid'],
      is_active: webhook.is_active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as WebhookIntegration;
    const updated = [saved, ...all];
    if (typeof window !== 'undefined') localStorage.setItem('asap_webhooks_store', JSON.stringify(updated));
  }

  return saved;
}

export async function deleteWebhook(id: string): Promise<void> {
  const configured = isSupabaseConfigured();
  if (configured) {
    const supabase = createClient();
    await supabase.from('webhook_integrations').delete().eq('id', id);
  }

  if (typeof window !== 'undefined') {
    const all = await getWebhooks();
    const updated = all.filter((w) => w.id !== id);
    localStorage.setItem('asap_webhooks_store', JSON.stringify(updated));
  }
}

export async function testWebhookDelivery(webhook: WebhookIntegration): Promise<{ success: boolean; statusCode: number; message: string }> {
  try {
    const testPayload = {
      event: 'test_connection',
      timestamp: new Date().toISOString(),
      label: webhook.label,
      message: 'Uji koneksi Google Sheets webhook berhasil dari sistem ASAP ISEP',
    };

    const res = await fetch('/api/webhooks/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhook.webhook_url, secret: webhook.secret_token, payload: testPayload }),
    });

    const result = await res.json();
    return result;
  } catch (err: any) {
    return { success: false, statusCode: 500, message: err.message || 'Koneksi gagal' };
  }
}
