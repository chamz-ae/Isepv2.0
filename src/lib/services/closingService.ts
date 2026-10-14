import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { CashierClosing, Payment } from '@/lib/supabase/types';
import { generateClosingNumber } from '@/lib/utils/formatters';
import { getOrders } from './orderService';

export async function getClosingStatsForShift(sinceDate?: string): Promise<{
  cashTotal: number;
  qrisTotal: number;
  transferTotal: number;
  roomChargeTotal: number;
  totalRevenue: number;
  transactionCount: number;
  payments: Payment[];
}> {
  const allOrders = await getOrders();
  const startTime = sinceDate ? new Date(sinceDate).getTime() : new Date().setHours(0, 0, 0, 0);

  let cashTotal = 0;
  let qrisTotal = 0;
  let transferTotal = 0;
  let roomChargeTotal = 0;
  const shiftPayments: Payment[] = [];

  for (const order of allOrders) {
    if (order.order_status === 'cancelled') continue;
    if (order.payments) {
      for (const p of order.payments) {
        if (p.status === 'confirmed' && new Date(p.paid_at).getTime() >= startTime) {
          shiftPayments.push(p);
          if (p.payment_method === 'cash') cashTotal += p.amount;
          else if (p.payment_method === 'qris') qrisTotal += p.amount;
          else if (p.payment_method === 'bank_transfer') transferTotal += p.amount;
          else if (p.payment_method === 'room_charge') roomChargeTotal += p.amount;
        }
      }
    }
  }

  const totalRevenue = cashTotal + qrisTotal + transferTotal + roomChargeTotal;

  return {
    cashTotal,
    qrisTotal,
    transferTotal,
    roomChargeTotal,
    totalRevenue,
    transactionCount: shiftPayments.length,
    payments: shiftPayments,
  };
}

export async function getCashierClosings(): Promise<CashierClosing[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('cashier_closings').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as CashierClosing[];
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_closings_store');
    if (stored) return JSON.parse(stored);
  }

  return [];
}

export async function createCashierClosing(params: {
  operatorName: string;
  actualCash: number;
  openedAt?: string;
  notes?: string;
}): Promise<CashierClosing> {
  const stats = await getClosingStatsForShift(params.openedAt);
  const closingNum = generateClosingNumber();
  const cashVariance = params.actualCash - stats.cashTotal;

  const closingRecord: CashierClosing = {
    id: 'cls_' + Date.now(),
    closing_number: closingNum,
    closing_date: new Date().toISOString().slice(0, 10),
    opened_at: params.openedAt || new Date().toISOString(),
    closed_at: new Date().toISOString(),
    operator_name: params.operatorName,
    expected_cash: stats.cashTotal,
    actual_cash: params.actualCash,
    cash_variance: cashVariance,
    qris_total: stats.qrisTotal,
    transfer_total: stats.transferTotal,
    room_charge_total: stats.roomChargeTotal,
    total_revenue: stats.totalRevenue,
    total_transactions: stats.transactionCount,
    notes: params.notes || null,
    created_at: new Date().toISOString(),
  };

  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('cashier_closings')
        .insert({
          closing_number: closingNum,
          closing_date: closingRecord.closing_date,
          opened_at: closingRecord.opened_at,
          closed_at: closingRecord.closed_at,
          operator_name: params.operatorName,
          expected_cash: stats.cashTotal,
          actual_cash: params.actualCash,
          cash_variance: cashVariance,
          qris_total: stats.qrisTotal,
          transfer_total: stats.transferTotal,
          room_charge_total: stats.roomChargeTotal,
          total_revenue: stats.totalRevenue,
          total_transactions: stats.transactionCount,
          notes: params.notes,
        })
        .select()
        .single();
      if (!error && data) return data as CashierClosing;
    } catch (err) {
      console.error('Error creating closing:', err);
    }
  }

  if (typeof window !== 'undefined') {
    const existing: CashierClosing[] = JSON.parse(localStorage.getItem('asap_closings_store') || '[]');
    localStorage.setItem('asap_closings_store', JSON.stringify([closingRecord, ...existing]));
  }

  return closingRecord;
}
