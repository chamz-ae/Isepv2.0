import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { WebhookIntegration, WebhookLog, Order } from '@/lib/supabase/types';

export const INITIAL_WEBHOOKS: WebhookIntegration[] = [
  {
    id: 'wh_001',
    label: 'Google Sheets — Rekap Transaksi Restoran & Inap',
    webhook_url: 'https://script.google.com/macros/s/AKfycbz_sample_endpoint_resto/exec',
    secret_token: 'asap_secret_tok_1',
    trigger_events: ['restaurant_paid', 'lodging_paid', 'all', 'order_created'],
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

/**
 * Dispatches order payload to all active webhooks for Google Sheets / Excel realtime updates
 */
export async function dispatchOrderWebhook(
  order: Order,
  eventName: string = 'order_created'
): Promise<void> {
  try {
    const activeWebhooks = (await getWebhooks()).filter((w) => w.is_active && w.webhook_url);
    if (activeWebhooks.length === 0) return;

    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      booking_code: order.booking_code,
      order_type: order.order_type,
      guest_name: order.guest_name,
      guest_phone: order.guest_phone,
      guest_email: order.guest_email || '-',
      check_in_date: order.check_in_date || '-',
      check_out_date: order.check_out_date || '-',
      room_name: order.room_name_snapshot || '-',
      table_number: order.table_number_snapshot || '-',
      total_guests: (order.adult_count || 1) + (order.teen_count || 0) + (order.child_count || 0),
      total_amount: order.total_amount,
      paid_amount: order.paid_amount,
      remaining_amount: order.remaining_amount,
      payment_status: order.payment_status,
      order_status: order.order_status,
      items_summary:
        order.order_items && order.order_items.length > 0
          ? order.order_items.map((i) => `${i.menu_name_snapshot} (${i.qty}x)`).join(', ')
          : '-',
      notes: order.notes || '-',
    };

    // Dispatch concurrently in the background
    await Promise.allSettled(
      activeWebhooks.map(async (wh) => {
        try {
          await fetch('/api/webhooks/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: wh.webhook_url,
              secret: wh.secret_token,
              payload,
            }),
          });
        } catch (e) {
          console.warn(`Failed to dispatch webhook ${wh.id}:`, e);
        }
      })
    );
  } catch (err) {
    console.warn('Webhook dispatch error:', err);
  }
}
