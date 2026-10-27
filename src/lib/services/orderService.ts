import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  Order,
  OrderItem,
  Payment,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
  OrderType,
  MeatType,
  StockMovement,
} from '@/lib/supabase/types';
import { generateBookingCode, generatePaymentNumber } from '@/lib/utils/formatters';
import { findOrCreateGuest, updateGuestVisitStats, isValidUuid, generateUuid } from './guestService';
import { checkRoomDateAvailability } from './roomService';
import { getInventoryItems } from './inventoryService';
import { dispatchOrderWebhook } from './webhookService';

export async function getOrders(options?: {
  status?: OrderStatus;
  type?: OrderType;
  paymentStatus?: PaymentStatus;
  searchQuery?: string;
}): Promise<Order[]> {
  let supabaseOrders: Order[] = [];
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      let query = supabase.from('orders').select('*, order_items(*), payments(*)');

      if (options?.status) query = query.eq('order_status', options.status);
      if (options?.type) query = query.eq('order_type', options.type);
      if (options?.paymentStatus) query = query.eq('payment_status', options.paymentStatus);
      if (options?.searchQuery && options.searchQuery.trim()) {
        const q = options.searchQuery.trim();
        query = query.or(`booking_code.ilike.%${q}%,guest_name.ilike.%${q}%,guest_phone.ilike.%${q}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) {
        supabaseOrders = data as Order[];
      }
    } catch {
      // Fallback
    }
  }

  // Local storage fallback and merge
  let localOrders: Order[] = [];
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_orders_store');
    if (stored) {
      try {
        localOrders = JSON.parse(stored);
      } catch {
        // Fallback
      }
    }
  }

  let combined: Order[] = [];
  if (supabaseOrders.length > 0) {
    const supabaseCodes = new Set(supabaseOrders.map((o) => (o.booking_code || '').toUpperCase()));
    const pendingLocal = localOrders.filter(
      (lo) => lo.booking_code && !supabaseCodes.has(lo.booking_code.toUpperCase())
    );
    combined = [...supabaseOrders, ...pendingLocal];
  } else {
    combined = localOrders;
  }

  if (options?.status) combined = combined.filter((o) => o.order_status === options.status);
  if (options?.type) combined = combined.filter((o) => o.order_type === options.type);
  if (options?.paymentStatus) combined = combined.filter((o) => o.payment_status === options.paymentStatus);
  if (options?.searchQuery && options.searchQuery.trim()) {
    const q = options.searchQuery.toLowerCase().trim();
    combined = combined.filter(
      (o) =>
        (o.booking_code && o.booking_code.toLowerCase().includes(q)) ||
        (o.guest_name && o.guest_name.toLowerCase().includes(q)) ||
        (o.guest_phone && o.guest_phone.includes(q))
    );
  }

  return combined;
}

export async function getOrderByBookingCode(bookingCode: string): Promise<Order | null> {
  if (!bookingCode) return null;
  const code = bookingCode.trim().toUpperCase();
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), payments(*)')
        .ilike('booking_code', code)
        .maybeSingle();
      if (!error && data) return data as Order;
    } catch {
      // Fallback
    }
  }

  // Fast check directly in localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_orders_store');
    if (stored) {
      try {
        const localOrders: Order[] = JSON.parse(stored);
        const match = localOrders.find((o) => o.booking_code && o.booking_code.toUpperCase() === code);
        if (match) return match;
      } catch {
        // Fallback
      }
    }
  }

  const all = await getOrders();
  return all.find((o) => o.booking_code && o.booking_code.toUpperCase() === code) || null;
}

export async function createOrder(params: {
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  orderType: OrderType;
  roomId?: string;
  roomNameSnapshot?: string;
  checkInDate?: string;
  checkOutDate?: string;
  adultCount?: number;
  teenCount?: number;
  childCount?: number;
  lodgingPricePerPersonSnapshot?: number;
  tableId?: string;
  tableNumberSnapshot?: string;
  items: {
    menuId?: string;
    menuName: string;
    unitPrice: number;
    meatType: MeatType;
    gramPerPortion: number;
    qty: number;
    subtotal: number;
    kdsNotes?: string;
  }[];
  downPayment?: number;
  paymentMethod?: PaymentMethod;
  isPaidImmediately?: boolean;
  notes?: string;
  operatorName?: string;
}): Promise<Order> {
  // Validate room availability if lodging included
  if (params.roomId && params.checkInDate && params.checkOutDate) {
    const isAvail = await checkRoomDateAvailability(params.roomId, params.checkInDate, params.checkOutDate);
    if (!isAvail) {
      throw new Error('Kamar tidak tersedia pada tanggal yang dipilih. Silakan pilih tanggal atau kamar lain.');
    }
  }

  // Register guest
  const guest = await findOrCreateGuest({
    name: params.guestName,
    phone: params.guestPhone,
    email: params.guestEmail,
  });

  const bookingCode = generateBookingCode();
  const adultCount = params.adultCount || 1;
  const teenCount = params.teenCount || 0;
  const childCount = params.childCount || 0;
  const totalGuests = adultCount + teenCount + childCount;
  const pricePerPerson = params.lodgingPricePerPersonSnapshot || 200000;

  // Calculate lodging subtotal
  let subtotalLodging = 0;
  if (params.orderType === 'lodging' || params.orderType === 'combined') {
    let nights = 1;
    if (params.checkInDate && params.checkOutDate) {
      const s = new Date(params.checkInDate);
      const e = new Date(params.checkOutDate);
      nights = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
    }
    subtotalLodging = totalGuests * pricePerPerson * nights;
  }

  // Calculate restaurant subtotal
  const subtotalDining = params.items.reduce((acc, it) => acc + it.subtotal, 0);
  const totalAmount = subtotalLodging + subtotalDining;

  let paidAmount = 0;
  let paymentStatus: PaymentStatus = 'unpaid';
  const downPayment = params.downPayment || 0;

  if (params.isPaidImmediately) {
    paidAmount = totalAmount;
    paymentStatus = 'paid';
  } else if (downPayment > 0) {
    paidAmount = Math.min(downPayment, totalAmount);
    paymentStatus = 'down_payment';
  }

  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const orderStatus: OrderStatus = paidAmount > 0 ? 'confirmed' : 'pending';

  const orderRecord: Order = {
    id: generateUuid(),
    booking_code: bookingCode,
    guest_id: guest.id,
    guest_name: params.guestName.trim(),
    guest_phone: params.guestPhone.trim(),
    guest_email: params.guestEmail?.trim() || null,
    order_type: params.orderType,

    room_id: params.roomId || null,
    room_name_snapshot: params.roomNameSnapshot || null,
    check_in_date: params.checkInDate || null,
    check_out_date: params.checkOutDate || null,
    adult_count: adultCount,
    teen_count: teenCount,
    child_count: childCount,
    lodging_price_per_person_snapshot: pricePerPerson,
    subtotal_lodging: subtotalLodging,

    table_id: params.tableId || null,
    table_number_snapshot: params.tableNumberSnapshot || null,
    subtotal_dining: subtotalDining,

    total_amount: totalAmount,
    down_payment: downPayment,
    paid_amount: paidAmount,
    remaining_amount: remainingAmount,

    order_status: orderStatus,
    payment_status: paymentStatus,
    notes: params.notes || null,

    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    order_items: params.items.map((it) => ({
      id: generateUuid(),
      order_id: '',
      menu_id: it.menuId || null,
      menu_name_snapshot: it.menuName,
      unit_price_snapshot: it.unitPrice,
      meat_type: it.meatType,
      gram_per_portion: it.gramPerPortion,
      qty: it.qty,
      total_gram: it.gramPerPortion * it.qty,
      subtotal: it.subtotal,
      kds_status: 'pending',
      kds_notes: it.kdsNotes || null,
      inventory_deducted: false,
      created_at: new Date().toISOString(),
    })),
    payments: [],
  };

  orderRecord.order_items?.forEach((it) => (it.order_id = orderRecord.id));

  // If initial payment was made
  if (paidAmount > 0) {
    const paymentRecord: Payment = {
      id: generateUuid(),
      payment_number: generatePaymentNumber(),
      order_id: orderRecord.id,
      amount: paidAmount,
      payment_method: params.paymentMethod || 'cash',
      is_down_payment: paymentStatus === 'down_payment',
      status: 'confirmed',
      notes: paymentStatus === 'down_payment' ? 'Down Payment Pemesanan' : 'Pembayaran Penuh',
      operator_name: params.operatorName || 'Kasir',
      paid_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    orderRecord.payments = [paymentRecord];
  }

  // Deduct meat stock live for ordered items
  await deductMeatStockLive(params.items, bookingCode, params.operatorName || 'Pemesanan Pelanggan');

  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const guestIdForSupabase = isValidUuid(guest?.id) ? guest.id : null;
      const roomIdForSupabase = isValidUuid(orderRecord.room_id) ? orderRecord.room_id : null;
      const tableIdForSupabase = isValidUuid(orderRecord.table_id) ? orderRecord.table_id : null;

      const { data: savedOrder, error } = await supabase
        .from('orders')
        .insert({
          id: orderRecord.id,
          booking_code: bookingCode,
          guest_id: guestIdForSupabase,
          guest_name: orderRecord.guest_name,
          guest_phone: orderRecord.guest_phone,
          guest_email: orderRecord.guest_email,
          order_type: orderRecord.order_type,
          room_id: roomIdForSupabase,
          room_name_snapshot: orderRecord.room_name_snapshot,
          check_in_date: orderRecord.check_in_date,
          check_out_date: orderRecord.check_out_date,
          adult_count: adultCount,
          teen_count: teenCount,
          child_count: childCount,
          lodging_price_per_person_snapshot: pricePerPerson,
          subtotal_lodging: subtotalLodging,
          table_id: tableIdForSupabase,
          table_number_snapshot: orderRecord.table_number_snapshot,
          subtotal_dining: subtotalDining,
          total_amount: totalAmount,
          down_payment: downPayment,
          paid_amount: paidAmount,
          remaining_amount: remainingAmount,
          order_status: orderStatus,
          payment_status: paymentStatus,
          notes: orderRecord.notes,
        })
        .select()
        .single();

      if (!error && savedOrder) {
        if (orderRecord.order_items && orderRecord.order_items.length > 0) {
          const itemsPayload = orderRecord.order_items.map((oi) => ({
            id: oi.id,
            order_id: savedOrder.id,
            menu_id: isValidUuid(oi.menu_id) ? oi.menu_id : null,
            menu_name_snapshot: oi.menu_name_snapshot,
            unit_price_snapshot: oi.unit_price_snapshot,
            meat_type: oi.meat_type,
            gram_per_portion: oi.gram_per_portion,
            qty: oi.qty,
            total_gram: oi.total_gram,
            subtotal: oi.subtotal,
            kds_status: 'pending',
            kds_notes: oi.kds_notes,
            inventory_deducted: true,
          }));
          await supabase.from('order_items').insert(itemsPayload);
        }

        if (paidAmount > 0 && orderRecord.payments?.[0]) {
          const p = orderRecord.payments[0];
          await supabase.from('payments').insert({
            id: p.id,
            payment_number: p.payment_number,
            order_id: savedOrder.id,
            amount: p.amount,
            payment_method: p.payment_method,
            is_down_payment: p.is_down_payment,
            status: 'confirmed',
            notes: p.notes,
            operator_name: p.operator_name,
            paid_at: p.paid_at,
          });
          if (guestIdForSupabase) {
            await updateGuestVisitStats(guestIdForSupabase, paidAmount);
          }
        }

        // Realtime webhook trigger to Google Sheets / Excel
        dispatchOrderWebhook({ ...orderRecord, ...savedOrder }, savedOrder.order_type === 'restaurant' ? 'restaurant_order' : 'lodging_order');

        // Keep local storage synced as well
        if (typeof window !== 'undefined') {
          const existing: Order[] = JSON.parse(localStorage.getItem('asap_orders_store') || '[]');
          const fullSaved = { ...orderRecord, ...savedOrder };
          localStorage.setItem('asap_orders_store', JSON.stringify([fullSaved, ...existing.filter((o) => o.id !== savedOrder.id)]));
          window.dispatchEvent(new Event('asap_orders_updated'));
        }

        return { ...orderRecord, ...savedOrder } as Order;
      } else if (error) {
        console.warn('Supabase insert order returned error:', error);
      }
    } catch (err) {
      console.error('Error inserting order in supabase:', err);
    }
  }

  // Local storage persistence
  if (typeof window !== 'undefined') {
    const existing: Order[] = JSON.parse(localStorage.getItem('asap_orders_store') || '[]');
    localStorage.setItem('asap_orders_store', JSON.stringify([orderRecord, ...existing]));
    if (paidAmount > 0) {
      await updateGuestVisitStats(guest.id, paidAmount);
    }
    window.dispatchEvent(new Event('asap_orders_updated'));
  }

  // Realtime webhook trigger to Google Sheets / Excel (local / fallback)
  dispatchOrderWebhook(orderRecord, orderRecord.order_type === 'restaurant' ? 'restaurant_order' : 'lodging_order');

  return orderRecord;
}

// Live meat stock deduction helper
async function deductMeatStockLive(
  items: { meatType: MeatType; qty: number; gramPerPortion: number; subtotal: number }[],
  bookingCode: string,
  operatorName: string
) {
  try {
    const meatItems = items.filter((it) => it.meatType && it.meatType !== 'none');
    if (meatItems.length === 0) return;

    const allInv = await getInventoryItems();
    const configured = isSupabaseConfigured();
    const updatedInv = [...allInv];
    const newMovements: StockMovement[] = [];
    const nowIso = new Date().toISOString();

    for (const it of meatItems) {
      const totalGramToDeduct = (it.gramPerPortion > 0 ? it.gramPerPortion : 100) * (it.qty || 1);
      const idx = updatedInv.findIndex((inv) => inv.meat_type === it.meatType && inv.category === 'cooked_meat');
      if (idx >= 0) {
        const inv = updatedInv[idx];
        const newStock = Math.max(0, inv.stock_gram - totalGramToDeduct);
        updatedInv[idx] = { ...inv, stock_gram: newStock, updated_at: nowIso };

        const mov: StockMovement = {
          id: 'sm_ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          inventory_id: inv.id,
          movement_type: 'usage',
          gram_change: -totalGramToDeduct,
          remaining_gram: newStock,
          reference_type: 'pos_order',
          reference_id: bookingCode,
          notes: `Penjualan ${it.meatType.toUpperCase()} - Order ${bookingCode}`,
          operator_name: operatorName,
          created_at: nowIso,
        };
        newMovements.push(mov);

        if (configured && isValidUuid(inv.id)) {
          try {
            const supabase = createClient();
            await supabase.from('inventory').update({ stock_gram: newStock, updated_at: nowIso }).eq('id', inv.id);
            await supabase.from('stock_movements').insert({
              inventory_id: inv.id,
              movement_type: 'order_sales',
              gram_change: -totalGramToDeduct,
              remaining_gram: newStock,
              reference_type: 'pos_order',
              reference_id: bookingCode,
              notes: mov.notes,
              operator_name: mov.operator_name,
            });
          } catch {}
        }
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('asap_inventory_store', JSON.stringify(updatedInv));
      const existingMovs = JSON.parse(localStorage.getItem('asap_stock_movements_store') || '[]');
      localStorage.setItem('asap_stock_movements_store', JSON.stringify([...newMovements, ...existingMovs]));
      window.dispatchEvent(new Event('asap_inventory_updated'));
    }
  } catch (err) {
    console.warn('Meat deduction warning:', err);
  }
}

export async function addItemsToExistingOrder(
  orderId: string,
  newItems: {
    menuId?: string;
    menuName: string;
    unitPrice: number;
    meatType: MeatType;
    gramPerPortion: number;
    qty: number;
    subtotal: number;
    kdsNotes?: string;
  }[]
): Promise<Order> {
  const all = await getOrders();
  const order = all.find((o) => o.id === orderId);
  if (!order) throw new Error('Order tidak ditemukan');
  if (order.order_status === 'cancelled') throw new Error('Tidak dapat menambah item pada order yang sudah dibatalkan');

  const additionalSubtotal = newItems.reduce((acc, it) => acc + it.subtotal, 0);
  const newSubtotalDining = (order.subtotal_dining || 0) + additionalSubtotal;
  const newTotal = (order.subtotal_lodging || 0) + newSubtotalDining;
  const newRemaining = Math.max(0, newTotal - order.paid_amount);

  const formattedItems: OrderItem[] = newItems.map((it) => ({
    id: 'item_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    order_id: orderId,
    menu_id: it.menuId || null,
    menu_name_snapshot: it.menuName,
    unit_price_snapshot: it.unitPrice,
    meat_type: it.meatType,
    gram_per_portion: it.gramPerPortion,
    qty: it.qty,
    total_gram: it.gramPerPortion * it.qty,
    subtotal: it.subtotal,
    kds_status: 'pending',
    kds_notes: it.kdsNotes || null,
    inventory_deducted: false,
    created_at: new Date().toISOString(),
  }));

  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      await supabase
        .from('orders')
        .update({
          subtotal_dining: newSubtotalDining,
          total_amount: newTotal,
          remaining_amount: newRemaining,
          payment_status: newRemaining === 0 ? 'paid' : order.paid_amount > 0 ? 'down_payment' : 'unpaid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      await supabase.from('order_items').insert(
        formattedItems.map((fi) => ({
          order_id: fi.order_id,
          menu_id: fi.menu_id,
          menu_name_snapshot: fi.menu_name_snapshot,
          unit_price_snapshot: fi.unit_price_snapshot,
          meat_type: fi.meat_type,
          gram_per_portion: fi.gram_per_portion,
          qty: fi.qty,
          total_gram: fi.total_gram,
          subtotal: fi.subtotal,
          kds_status: 'pending',
          kds_notes: fi.kds_notes,
          inventory_deducted: false,
        }))
      );
    } catch {
      // Fallback
    }
  }

  const updatedOrder: Order = {
    ...order,
    subtotal_dining: newSubtotalDining,
    total_amount: newTotal,
    remaining_amount: newRemaining,
    payment_status: newRemaining === 0 ? 'paid' : order.paid_amount > 0 ? 'down_payment' : 'unpaid',
    order_items: [...(order.order_items || []), ...formattedItems],
    updated_at: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const list = all.map((o) => (o.id === orderId ? updatedOrder : o));
    localStorage.setItem('asap_orders_store', JSON.stringify(list));
  }

  return updatedOrder;
}

export async function recordPaymentForOrder(params: {
  orderId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  isDownPayment: boolean;
  referenceNumber?: string;
  notes?: string;
  operatorName: string;
}): Promise<Payment> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('rpc_record_payment_atomic', {
        p_order_id: params.orderId,
        p_amount: params.amount,
        p_method: params.paymentMethod,
        p_is_dp: params.isDownPayment,
        p_reference: params.referenceNumber || null,
        p_operator: params.operatorName,
        p_notes: params.notes || null,
      });

      if (!error && data?.payment_id) {
        const { data: p } = await supabase.from('payments').select('*').eq('id', data.payment_id).single();
        if (p) return p as Payment;
      }
    } catch (err) {
      console.error('Error recording payment rpc:', err);
    }
  }

  // Local storage simulation
  const all = await getOrders();
  const order = all.find((o) => o.id === params.orderId);
  if (!order) throw new Error('Order tidak ditemukan');

  const newPaid = order.paid_amount + params.amount;
  const newRemaining = Math.max(0, order.total_amount - newPaid);
  const newStatus: PaymentStatus = newRemaining === 0 ? 'paid' : 'down_payment';

  const paymentRecord: Payment = {
    id: 'pay_' + Date.now(),
    payment_number: generatePaymentNumber(),
    order_id: params.orderId,
    amount: params.amount,
    payment_method: params.paymentMethod,
    is_down_payment: params.isDownPayment,
    status: 'confirmed',
    reference_number: params.referenceNumber || null,
    notes: params.notes || null,
    operator_name: params.operatorName,
    paid_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  const updatedOrder: Order = {
    ...order,
    paid_amount: newPaid,
    remaining_amount: newRemaining,
    payment_status: newStatus,
    order_status: order.order_status === 'pending' ? 'confirmed' : order.order_status,
    payments: [...(order.payments || []), paymentRecord],
    updated_at: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const list = all.map((o) => (o.id === params.orderId ? updatedOrder : o));
    localStorage.setItem('asap_orders_store', JSON.stringify(list));
    if (order.guest_id) {
      await updateGuestVisitStats(order.guest_id, params.amount);
    }
  }

  return paymentRecord;
}

export async function voidOrder(params: {
  orderId: string;
  reason: string;
  operatorName: string;
}): Promise<void> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      await supabase.rpc('rpc_void_order_atomic', {
        p_order_id: params.orderId,
        p_reason: params.reason,
        p_operator: params.operatorName,
      });
      return;
    } catch (err) {
      console.error('Error voiding order rpc:', err);
    }
  }

  // Local storage void simulation with stock rollback
  const all = await getOrders();
  const order = all.find((o) => o.id === params.orderId);
  if (!order) throw new Error('Order tidak ditemukan');
  if (order.order_status === 'cancelled') throw new Error('Order sudah pernah dibatalkan');

  // Rollback any deducted meat inventory
  const invItems = await getInventoryItems();
  const newMovements: StockMovement[] = [];
  const updatedInv = [...invItems];

  if (order.order_items) {
    for (const item of order.order_items) {
      if (item.inventory_deducted && item.meat_type !== 'none' && item.total_gram > 0) {
        const idx = updatedInv.findIndex((i) => i.meat_type === item.meat_type && i.category === 'cooked_meat');
        if (idx >= 0) {
          const inv = updatedInv[idx];
          const newStock = inv.stock_gram + item.total_gram;
          updatedInv[idx] = { ...inv, stock_gram: newStock };
          newMovements.push({
            id: 'sm_void_' + Date.now(),
            inventory_id: inv.id,
            movement_type: 'void_return',
            gram_change: item.total_gram,
            remaining_gram: newStock,
            reference_type: 'order_cancellation',
            reference_id: order.id,
            notes: `Pengembalian stok pembatalan order ${order.booking_code}`,
            operator_name: params.operatorName,
            created_at: new Date().toISOString(),
          });
        }
      }
    }
  }

  const updatedOrder: Order = {
    ...order,
    order_status: 'cancelled',
    cancellation_reason: params.reason,
    cancelled_by: params.operatorName,
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    const list = all.map((o) => (o.id === params.orderId ? updatedOrder : o));
    localStorage.setItem('asap_orders_store', JSON.stringify(list));
    localStorage.setItem('asap_inventory_store', JSON.stringify(updatedInv));
    if (newMovements.length > 0) {
      const existingMovs = JSON.parse(localStorage.getItem('asap_stock_movements_store') || '[]');
      localStorage.setItem('asap_stock_movements_store', JSON.stringify([...newMovements, ...existingMovs]));
    }
  }
}
