import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { OrderItem, KdsStatus, MeatType } from '@/lib/supabase/types';
import { getOrders } from './orderService';

export interface KdsTicketItem {
  id: string;
  orderId: string;
  bookingCode: string;
  tableOrRoom: string;
  menuName: string;
  meatType: MeatType;
  gramPerPortion: number;
  qty: number;
  totalGram: number;
  kdsStatus: KdsStatus;
  kdsNotes?: string | null;
  createdAt: string;
  orderNotes?: string | null;
}

export async function getKdsTickets(filterStatus?: KdsStatus | 'active'): Promise<KdsTicketItem[]> {
  const allOrders = await getOrders();
  const tickets: KdsTicketItem[] = [];

  for (const order of allOrders) {
    if (order.order_status === 'cancelled') continue;
    const tableOrRoom = order.table_number_snapshot
      ? `Meja ${order.table_number_snapshot}`
      : order.room_name_snapshot
      ? `Kamar ${order.room_name_snapshot}`
      : 'Bawa Pulang / Umum';

    if (order.order_items) {
      for (const item of order.order_items) {
        if (filterStatus === 'active') {
          if (item.kds_status === 'served') continue;
        } else if (filterStatus && item.kds_status !== filterStatus) {
          continue;
        }

        tickets.push({
          id: item.id,
          orderId: order.id,
          bookingCode: order.booking_code,
          tableOrRoom,
          menuName: item.menu_name_snapshot,
          meatType: item.meat_type,
          gramPerPortion: item.gram_per_portion,
          qty: item.qty,
          totalGram: item.total_gram,
          kdsStatus: item.kds_status,
          kdsNotes: item.kds_notes,
          createdAt: item.created_at,
          orderNotes: order.notes,
        });
      }
    }
  }

  // Sort: oldest pending first (FIFO)
  return tickets.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function updateKdsItemStatus(itemId: string, newStatus: KdsStatus): Promise<void> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      await supabase.from('order_items').update({ kds_status: newStatus }).eq('id', itemId);
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_orders_store');
    if (stored) {
      const allOrders = JSON.parse(stored);
      const updated = allOrders.map((ord: any) => {
        if (ord.order_items) {
          const items = ord.order_items.map((it: any) => {
            if (it.id === itemId) {
              return { ...it, kds_status: newStatus };
            }
            return it;
          });
          return { ...ord, order_items: items };
        }
        return ord;
      });
      localStorage.setItem('asap_orders_store', JSON.stringify(updated));
    }
  }
}
