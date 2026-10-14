import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Purchase, CashierClosing } from '@/lib/supabase/types';
import { getOrders } from './orderService';
import { getPurchases } from './purchasingService';
import { getCashierClosings } from './closingService';
import { formatRupiah, formatGram, formatDateWIB, formatDateTimeWIB } from '@/lib/utils/formatters';

export interface ReportFilter {
  dateRange: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'this_year' | 'custom';
  startDate?: string;
  endDate?: string;
  businessUnit: 'all' | 'restaurant' | 'lodging';
}

export interface ReportSummary {
  grossRevenue: number;
  restaurantRevenue: number;
  lodgingRevenue: number;
  totalExpenses: number;
  estimatedNetProfit: number;
  paymentBreakdown: {
    cash: number;
    qris: number;
    bankTransfer: number;
    roomCharge: number;
  };
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  topSellingMenus: { name: string; portions: number; revenue: number }[];
  meatUsageGrams: { meatType: string; totalGrams: number }[];
  occupancyRatePercentage: number;
  avgStayLengthDays: number;
  orders: Order[];
  purchases: Purchase[];
}

export function getDateBoundaries(filter: ReportFilter): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  switch (filter.dateRange) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_week':
      const day = now.getDay() || 7;
      start.setDate(now.getDate() - day + 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'this_year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'custom':
      if (filter.startDate) {
        const s = new Date(filter.startDate);
        s.setHours(0, 0, 0, 0);
        start.setTime(s.getTime());
      }
      if (filter.endDate) {
        const e = new Date(filter.endDate);
        e.setHours(23, 59, 59, 999);
        end.setTime(e.getTime());
      }
      break;
  }
  return { start, end };
}

export async function generateReportSummary(filter: ReportFilter): Promise<ReportSummary> {
  const { start, end } = getDateBoundaries(filter);
  const allOrders = await getOrders();
  const allPurchases = await getPurchases();

  // Filter orders by date and business unit
  const filteredOrders = allOrders.filter((ord) => {
    const ordDate = new Date(ord.created_at);
    if (ordDate < start || ordDate > end) return false;
    if (filter.businessUnit === 'restaurant' && ord.order_type === 'lodging') return false;
    if (filter.businessUnit === 'lodging' && ord.order_type === 'restaurant') return false;
    return true;
  });

  // Filter purchases by date
  const filteredPurchases = allPurchases.filter((po) => {
    const poDate = new Date(po.purchase_date);
    return poDate >= start && poDate <= end;
  });

  let restaurantRevenue = 0;
  let lodgingRevenue = 0;
  let cash = 0;
  let qris = 0;
  let bankTransfer = 0;
  let roomCharge = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;

  const menuCountMap: Record<string, { portions: number; revenue: number }> = {};
  const meatUsageMap: Record<string, number> = {};
  let totalStayNights = 0;
  let lodgingBookingsCount = 0;

  for (const ord of filteredOrders) {
    if (ord.order_status === 'cancelled') {
      cancelledOrders++;
      continue;
    }
    completedOrders++;

    restaurantRevenue += ord.subtotal_dining || 0;
    lodgingRevenue += ord.subtotal_lodging || 0;

    // Payments
    if (ord.payments) {
      for (const p of ord.payments) {
        if (p.status === 'confirmed') {
          if (p.payment_method === 'cash') cash += p.amount;
          else if (p.payment_method === 'qris') qris += p.amount;
          else if (p.payment_method === 'bank_transfer') bankTransfer += p.amount;
          else if (p.payment_method === 'room_charge') roomCharge += p.amount;
        }
      }
    }

    // Menu portions & Meat usage
    if (ord.order_items) {
      for (const item of ord.order_items) {
        if (!menuCountMap[item.menu_name_snapshot]) {
          menuCountMap[item.menu_name_snapshot] = { portions: 0, revenue: 0 };
        }
        menuCountMap[item.menu_name_snapshot].portions += item.qty;
        menuCountMap[item.menu_name_snapshot].revenue += item.subtotal;

        if (item.meat_type && item.meat_type !== 'none' && item.total_gram > 0) {
          meatUsageMap[item.meat_type] = (meatUsageMap[item.meat_type] || 0) + item.total_gram;
        }
      }
    }

    // Lodging stay length
    if (ord.check_in_date && ord.check_out_date) {
      const s = new Date(ord.check_in_date);
      const e = new Date(ord.check_out_date);
      const nights = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      totalStayNights += nights;
      lodgingBookingsCount++;
    }
  }

  const grossRevenue = restaurantRevenue + lodgingRevenue;
  const totalExpenses = filteredPurchases.reduce((acc, p) => acc + p.total_amount, 0);
  const estimatedNetProfit = grossRevenue - totalExpenses;

  const topSellingMenus = Object.entries(menuCountMap)
    .map(([name, val]) => ({ name, portions: val.portions, revenue: val.revenue }))
    .sort((a, b) => b.portions - a.portions)
    .slice(0, 10);

  const meatUsageGrams = Object.entries(meatUsageMap)
    .map(([meatType, totalGrams]) => ({ meatType, totalGrams }))
    .sort((a, b) => b.totalGrams - a.totalGrams);

  const avgStayLengthDays = lodgingBookingsCount > 0 ? parseFloat((totalStayNights / lodgingBookingsCount).toFixed(1)) : 0;
  // Estimated occupancy based on active bookings vs 3 rooms across days in window
  const daysInFilter = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const totalAvailableRoomNights = 3 * daysInFilter;
  const occupancyRatePercentage = totalAvailableRoomNights > 0 ? Math.min(100, parseFloat(((totalStayNights / totalAvailableRoomNights) * 100).toFixed(1))) : 0;

  return {
    grossRevenue,
    restaurantRevenue,
    lodgingRevenue,
    totalExpenses,
    estimatedNetProfit,
    paymentBreakdown: { cash, qris, bankTransfer, roomCharge },
    totalOrders: filteredOrders.length,
    completedOrders,
    cancelledOrders,
    topSellingMenus,
    meatUsageGrams,
    occupancyRatePercentage,
    avgStayLengthDays,
    orders: filteredOrders,
    purchases: filteredPurchases,
  };
}

export function exportReportToExcel(summary: ReportSummary, filterLabel: string) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan Eksekutif
  const summaryData = [
    ['LAPORAN KEUANGAN & OPERASIONAL — ASAP ISEP'],
    ['Periode:', filterLabel],
    ['Tanggal Dibuat:', formatDateTimeWIB(new Date())],
    [],
    ['METRIK UTAMA', 'NILAI'],
    ['Gross Revenue (Omzet Kotor)', summary.grossRevenue],
    ['Omzet Restoran', summary.restaurantRevenue],
    ['Omzet Penginapan', summary.lodgingRevenue],
    ['Total Pengeluaran (Belanja)', summary.totalExpenses],
    ['Estimasi Laba Bersih', summary.estimatedNetProfit],
    [],
    ['METODE PEMBAYARAN', 'JUMLAH (RP)'],
    ['Cash', summary.paymentBreakdown.cash],
    ['QRIS', summary.paymentBreakdown.qris],
    ['Transfer Bank', summary.paymentBreakdown.bankTransfer],
    ['Tagih Kamar', summary.paymentBreakdown.roomCharge],
    [],
    ['OPERASIONAL KAMAR', 'STATISTIK'],
    ['Tingkat Hunian (Occupancy Rate)', `${summary.occupancyRatePercentage}%`],
    ['Rata-rata Lama Menginap', `${summary.avgStayLengthDays} Malam`],
  ];
  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan');

  // Sheet 2: Transaksi Pesanan
  const ordersData = [
    ['Booking Code', 'Tamu', 'No. HP', 'Tipe', 'Total (Rp)', 'Dibayar (Rp)', 'Sisa (Rp)', 'Status Order', 'Status Bayar', 'Tanggal'],
    ...summary.orders.map((o) => [
      o.booking_code,
      o.guest_name,
      o.guest_phone,
      o.order_type,
      o.total_amount,
      o.paid_amount,
      o.remaining_amount,
      o.order_status,
      o.payment_status,
      formatDateTimeWIB(o.created_at),
    ]),
  ];
  const wsOrders = XLSX.utils.aoa_to_sheet(ordersData);
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Data Pesanan');

  // Sheet 3: Penggunaan Daging
  const meatData = [
    ['Jenis Daging', 'Penggunaan (Gram)', 'Penggunaan (Kg)'],
    ...summary.meatUsageGrams.map((m) => [m.meatType.toUpperCase(), m.totalGrams, (m.totalGrams / 1000).toFixed(2)]),
  ];
  const wsMeat = XLSX.utils.aoa_to_sheet(meatData);
  XLSX.utils.book_append_sheet(wb, wsMeat, 'Penggunaan Daging');

  // Sheet 4: Pembelian Supplier
  const poData = [
    ['No PO', 'Supplier', 'Kategori', 'Total (Rp)', 'Metode Bayar', 'Operator', 'Tanggal'],
    ...summary.purchases.map((p) => [
      p.purchase_number,
      p.supplier_name_snapshot,
      p.category,
      p.total_amount,
      p.payment_method,
      p.operator_name,
      p.purchase_date,
    ]),
  ];
  const wsPo = XLSX.utils.aoa_to_sheet(poData);
  XLSX.utils.book_append_sheet(wb, wsPo, 'Pengeluaran Belanja');

  XLSX.writeFile(wb, `ASAP_ISEP_LAPORAN_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportReportToPDF(summary: ReportSummary, filterLabel: string) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.text('ASAP ISEP — DAGING ASAP', 14, 20);
  doc.setFontSize(11);
  doc.text('Laporan Operasional & Keuangan Smokehouse & Lodging', 14, 28);
  doc.setFontSize(9);
  doc.text(`Periode: ${filterLabel} | Dicetak: ${formatDateTimeWIB(new Date())}`, 14, 34);

  // Summary Metrics Table
  autoTable(doc, {
    startY: 42,
    head: [['Indikator Kinerja', 'Jumlah (IDR / Metrik)']],
    body: [
      ['Gross Revenue (Omzet Kotor)', formatRupiah(summary.grossRevenue)],
      ['Omzet Restoran', formatRupiah(summary.restaurantRevenue)],
      ['Omzet Penginapan', formatRupiah(summary.lodgingRevenue)],
      ['Total Belanja & Biaya Operasional', formatRupiah(summary.totalExpenses)],
      ['Estimasi Laba Bersih', formatRupiah(summary.estimatedNetProfit)],
      ['Pembayaran Cash', formatRupiah(summary.paymentBreakdown.cash)],
      ['Pembayaran QRIS', formatRupiah(summary.paymentBreakdown.qris)],
      ['Pembayaran Transfer Bank', formatRupiah(summary.paymentBreakdown.bankTransfer)],
      ['Occupancy Rate Penginapan', `${summary.occupancyRatePercentage}%`],
      ['Rata-rata Lama Menginap', `${summary.avgStayLengthDays} Malam`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [40, 40, 40] },
  });

  // Top Selling Menus Table
  if (summary.topSellingMenus.length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 120;
    doc.setFontSize(12);
    doc.text('Menu Terlaris & Kontribusi Omzet', 14, finalY + 12);

    autoTable(doc, {
      startY: finalY + 16,
      head: [['Nama Menu', 'Porsi Terjual', 'Subtotal (IDR)']],
      body: summary.topSellingMenus.map((m) => [m.name, `${m.portions} porsi`, formatRupiah(m.revenue)]),
      theme: 'grid',
      headStyles: { fillColor: [80, 50, 30] },
    });
  }

  // Meat Consumption
  if (summary.meatUsageGrams.length > 0) {
    const finalY2 = (doc as any).lastAutoTable.finalY || 200;
    if (finalY2 > 230) doc.addPage();
    const startYMeat = finalY2 > 230 ? 20 : finalY2 + 12;

    doc.setFontSize(12);
    doc.text('Penggunaan Daging (Inventory Meat Usage)', 14, startYMeat);

    autoTable(doc, {
      startY: startYMeat + 4,
      head: [['Jenis Daging', 'Total Gram', 'Total Kilogram']],
      body: summary.meatUsageGrams.map((m) => [m.meatType.toUpperCase(), formatGram(m.totalGrams), `${(m.totalGrams / 1000).toFixed(2)} kg`]),
      theme: 'grid',
      headStyles: { fillColor: [120, 60, 40] },
    });
  }

  doc.save(`ASAP_ISEP_LAPORAN_${new Date().toISOString().slice(0, 10)}.pdf`);
}
