'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  DollarSign,
  CreditCard,
  BedDouble,
  UtensilsCrossed,
  Boxes,
  AlertTriangle,
  Calendar,
  Clock,
  ArrowUpRight,
  PlusCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Phone,
  ExternalLink,
  MessageSquare,
  ChefHat,
  History,
  Lock,
  BookOpen,
  DoorOpen,
  Truck,
  ShoppingBag,
  Scale,
  ClipboardCheck,
  BarChart3,
  Image as ImageIcon,
  Settings,
  Sparkles,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { getOrders } from '@/lib/services/orderService';
import { getRooms, getTables } from '@/lib/services/roomService';
import { getInventoryItems } from '@/lib/services/inventoryService';
import { Order, Room, RestaurantTable, InventoryItem } from '@/lib/supabase/types';
import { formatRupiah, formatGram, formatDateTimeWIB, formatDateWIB, generateWhatsAppLink } from '@/lib/utils/formatters';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Requirement 1.2: Datebox for choosing date flexibly
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  async function loadData() {
    try {
      const [ordList, roomList, tableList, invList] = await Promise.all([
        getOrders(),
        getRooms({ activeOnly: true }),
        getTables(),
        getInventoryItems(),
      ]);
      setOrders(ordList);
      setRooms(roomList);
      setTables(tableList);
      setInventory(invList);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    // Auto-sync across customer order placements and tabs (Requirement 2.3 & 3.3)
    const handleUpdate = () => loadData();
    window.addEventListener('asap_orders_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('asap_orders_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Filter today's data in Asia/Jakarta timezone
  const todayOrders = orders.filter((o) => {
    if (o.order_status === 'cancelled') return false;
    const ordDate = o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : '';
    return ordDate === todayStr;
  });

  const totalVisitorsToday = todayOrders.reduce((acc, o) => {
    if (o.order_type === 'lodging' || o.order_type === 'combined') {
      return acc + (o.adult_count || 1) + (o.teen_count || 0) + (o.child_count || 0);
    }
    return acc + 1;
  }, 0);

  const todayRevenue = todayOrders.reduce((acc, o) => acc + o.paid_amount, 0);

  // Payments breakdown for today
  let todayCash = 0;
  let todayQris = 0;
  let todayTransfer = 0;

  for (const o of todayOrders) {
    if (o.payments) {
      for (const p of o.payments) {
        if (p.status === 'confirmed') {
          if (p.payment_method === 'cash') todayCash += p.amount;
          else if (p.payment_method === 'qris') todayQris += p.amount;
          else if (p.payment_method === 'bank_transfer') todayTransfer += p.amount;
        }
      }
    }
  }

  // Room status counts for today
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied').length;
  const availableRooms = rooms.filter((r) => r.status === 'available').length;

  // Table status counts
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
  const availableTables = tables.filter((t) => t.status === 'available').length;

  // Critical stock items (current <= minimum)
  const criticalStockItems = inventory.filter(
    (item) => item.is_active && item.stock_gram <= item.minimum_stock_gram
  );

  // Unpaid or partially paid active orders
  const unpaidOrders = orders.filter(
    (o) => o.order_status !== 'cancelled' && (o.payment_status === 'unpaid' || o.payment_status === 'down_payment')
  );

  // ----------------------------------------------------------------------
  // CALENDAR & DATEBOX LOGIC (Requirements 1.2, 1.3, 1.4)
  // ----------------------------------------------------------------------

  // Helper to check bookings on any given date string (YYYY-MM-DD)
  const getBookingsOnDate = (dateStr: string) => {
    return orders.filter((o) => {
      if (o.order_status === 'cancelled') return false;
      if (!o.check_in_date || !o.check_out_date || !o.room_id) return false;
      // An order stays during the night of check_in_date up to check_out_date
      return o.check_in_date <= dateStr && o.check_out_date > dateStr;
    });
  };

  // Bookings on the currently selected date
  const bookingsOnSelectedDate = getBookingsOnDate(selectedDate);
  const bookedRoomIdsOnSelected = new Set(bookingsOnSelectedDate.map((b) => b.room_id));

  const bookedRoomsDetail = rooms.filter((r) => bookedRoomIdsOnSelected.has(r.id)).map((r) => {
    const booking = bookingsOnSelectedDate.find((b) => b.room_id === r.id);
    return { room: r, booking };
  });

  const availableRoomsDetail = rooms.filter((r) => !bookedRoomIdsOnSelected.has(r.id));
  const isSelectedDateFullBooked = rooms.length > 0 && availableRoomsDetail.length === 0;

  // Month grid generator for calendar view
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = lastDayOfMonth.getDate();

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(year, month + 1, 1));
  };

  const handleQuickDate = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const str = target.toISOString().slice(0, 10);
    setSelectedDate(str);
    setCalendarMonth(new Date(target.getFullYear(), target.getMonth(), 1));
  };

  // Quick Module Launch Matrix State (Requirement 3: UX to easily open available pages)
  const [activeModuleFilter, setActiveModuleFilter] = useState<string>('all');
  const [isModuleGridOpen, setIsModuleGridOpen] = useState(true);

  const operationalModules = [
    // Operasional Utama
    { href: '/admin/pesanan-restoran', title: 'POS Restoran', desc: 'Kasir & timbang daging', icon: UtensilsCrossed, category: 'operasional', badge: 'POS', iconBg: 'bg-amber-100 text-amber-800' },
    { href: '/admin/pesanan-penginapan', title: 'Booking Inap', desc: 'Reservasi kabin & tamu', icon: BedDouble, category: 'operasional', badge: 'Inap', iconBg: 'bg-emerald-100 text-emerald-800' },
    { href: '/admin/kds', title: 'Kitchen (KDS)', desc: 'Layar pesanan panggangan', icon: ChefHat, category: 'operasional', badge: 'Live', iconBg: 'bg-red-100 text-red-800' },
    { href: '/admin/order-history', title: 'Riwayat Transaksi', desc: 'Audit order & status bayar', icon: History, category: 'operasional', iconBg: 'bg-blue-100 text-blue-800' },
    { href: '/admin/pembayaran', title: 'Pembayaran Kasir', desc: 'Pencatatan cash, QRIS, & transfer', icon: CreditCard, category: 'operasional', iconBg: 'bg-purple-100 text-purple-800' },
    { href: '/admin/closing', title: 'Closing Kasir', desc: 'Tutup buku harian shift kasir', icon: Lock, category: 'operasional', iconBg: 'bg-stone-200 text-stone-800' },

    // Master Data & Fasilitas
    { href: '/admin/menu', title: 'Menu Restoran', desc: 'Master harga & gramasi daging', icon: BookOpen, category: 'master', iconBg: 'bg-amber-100 text-amber-800' },
    { href: '/admin/kamar', title: 'Kamar Kabin', desc: 'Status kabin & ketersediaan', icon: DoorOpen, category: 'master', iconBg: 'bg-emerald-100 text-emerald-800' },
    { href: '/admin/meja', title: 'Meja Restoran', desc: 'Denah & nomor meja makan', icon: UtensilsCrossed, category: 'master', iconBg: 'bg-indigo-100 text-indigo-800' },
    { href: '/admin/tamu', title: 'Data Tamu', desc: 'Database loyalitas pelanggan', icon: Users, category: 'master', iconBg: 'bg-sky-100 text-sky-800' },
    { href: '/admin/suppliers', title: 'Data Supplier', desc: 'Mitra pasokan daging & belanja', icon: Truck, category: 'master', iconBg: 'bg-stone-200 text-stone-800' },

    // Inventori & Dapur
    { href: '/admin/purchasing', title: 'Belanja Daging', desc: 'Faktur & PO pembelian bahan', icon: ShoppingBag, category: 'inventori', iconBg: 'bg-teal-100 text-teal-800' },
    { href: '/admin/inventory', title: 'Stok Daging & Bahan', desc: 'Monitoring gramasi bahan baku', icon: Boxes, category: 'inventori', iconBg: 'bg-emerald-100 text-emerald-800' },
    { href: '/admin/cooking', title: 'Cooking Yield Rate', desc: 'Susut pengasapan & yield rate', icon: Scale, category: 'inventori', iconBg: 'bg-amber-100 text-amber-800' },
    { href: '/admin/stock-opname', title: 'Stock Opname', desc: 'Cek fisik vs sistem selisih', icon: ClipboardCheck, category: 'inventori', iconBg: 'bg-cyan-100 text-cyan-800' },

    // Analitik & Sistem
    { href: '/admin/laporan', title: 'Laporan & Omzet', desc: 'Analisis penjualan & laba rugi', icon: BarChart3, category: 'sistem', iconBg: 'bg-rose-100 text-rose-800' },
    { href: '/admin/gallery', title: 'Galeri Foto Tamu', desc: 'Moderasi upload pengalaman tamu', icon: ImageIcon, category: 'sistem', iconBg: 'bg-violet-100 text-violet-800' },
    { href: '/admin/pengaturan', title: 'Pengaturan Sistem', desc: 'Integrasi, webhook, & konfigurasi', icon: Settings, category: 'sistem', iconBg: 'bg-stone-200 text-stone-800' },
  ];

  const filteredModules = operationalModules.filter((m) => {
    if (activeModuleFilter === 'all') return true;
    return m.category === activeModuleFilter;
  });

  return (
    <div className="space-y-8">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-stone-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Dashboard Operasional</h1>
          <p className="text-xs text-stone-500 mt-1">
            Data terpadu food forest smokehouse, kabin inap, inventori daging, dan kasir real-time (WIB).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link href="/admin/pesanan-restoran">
            <Button variant="amber" size="sm">
              <PlusCircle className="w-4 h-4 mr-1" />
              <span>POS Restoran</span>
            </Button>
          </Link>
          <Link href="/admin/pesanan-penginapan">
            <Button variant="outline" size="sm">
              <BedDouble className="w-4 h-4 mr-1 text-stone-600" />
              <span>Booking Inap</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Requirement 3: Quick Module Launcher Matrix (UX Feature to effortlessly open any module) */}
      <Card className="border-stone-300 shadow-xs bg-stone-50/60 overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <span>Pusat Pintasan Cepat Modul Operasional</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-bold">
                  18 Modul
                </span>
              </h2>
              <p className="text-[11px] text-stone-500">
                Akses instan 1-klik ke seluruh fungsi kasir, inventori, dapur, dan laporan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 text-xs overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveModuleFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                  activeModuleFilter === 'all'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setActiveModuleFilter('operasional')}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                  activeModuleFilter === 'operasional'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Operasional (6)
              </button>
              <button
                type="button"
                onClick={() => setActiveModuleFilter('master')}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                  activeModuleFilter === 'master'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Master (5)
              </button>
              <button
                type="button"
                onClick={() => setActiveModuleFilter('inventori')}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                  activeModuleFilter === 'inventori'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Inventori (4)
              </button>
              <button
                type="button"
                onClick={() => setActiveModuleFilter('sistem')}
                className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                  activeModuleFilter === 'sistem'
                    ? 'bg-stone-900 text-white font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sistem (3)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsModuleGridOpen(!isModuleGridOpen)}
              className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-600"
              title={isModuleGridOpen ? 'Sembunyikan Pintasan' : 'Tampilkan Pintasan'}
            >
              {isModuleGridOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isModuleGridOpen && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 pt-3 animate-in fade-in">
            {filteredModules.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group p-3 bg-white hover:bg-stone-900 border border-stone-200/90 hover:border-stone-900 rounded-xl transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${item.iconBg} group-hover:bg-amber-500 group-hover:text-stone-950`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {item.badge ? (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 group-hover:bg-stone-800 group-hover:text-amber-400">
                        {item.badge}
                      </span>
                    ) : (
                      <ArrowUpRight className="w-3 h-3 text-stone-300 group-hover:text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900 group-hover:text-white truncate">
                      {item.title}
                    </div>
                    <div className="text-[10px] text-stone-500 group-hover:text-stone-400 line-clamp-1 mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>


      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white to-stone-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Omzet Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900 tracking-tight">
            {formatRupiah(todayRevenue)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Dari transaksi terekam per hari ini</p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-stone-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Pengunjung Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900 tracking-tight">
            {totalVisitorsToday} <span className="text-sm font-normal text-stone-500">Orang</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{todayOrders.length} transaksi pemesanan hari ini</p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-stone-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Kamar Kabin</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900 tracking-tight">
            {availableRooms} <span className="text-sm font-normal text-stone-500">Tersedia</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{occupiedRooms} Terisi • Total {rooms.length} Unit</p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-stone-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Meja Restoran</span>
            <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900 tracking-tight">
            {availableTables} <span className="text-sm font-normal text-stone-500">Kosong</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">{occupiedTables} Terisi • Total {tables.length} Meja</p>
        </Card>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SECTION 1: LIVE CALENDAR, DATEBOX & ROOM DETAIL INSPECTOR         */}
      {/* (Requirements 1.2, 1.3, 1.4)                                      */}
      {/* ------------------------------------------------------------------ */}
      <Card className="border-stone-300 shadow-md">
        <div className="border-b border-stone-200 pb-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <span>Kalender Ketersediaan & Jadwal Kabin Inap</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Pilih tanggal melalui datebox atau klik tanggal pada kalender untuk memeriksa kamar terisi, pesanan, dan kamar kosong.
              </p>
            </div>

            {/* Requirement 1.2: Datebox Input & Quick Date Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-300 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleQuickDate(0)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                    selectedDate === todayStr ? 'bg-stone-900 text-white' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(1)}
                  className="px-2.5 py-1 text-xs rounded-lg font-semibold text-stone-600 hover:text-stone-900"
                >
                  Besok
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDate(7)}
                  className="px-2.5 py-1 text-xs rounded-lg font-semibold text-stone-600 hover:text-stone-900"
                >
                  +7 Hari
                </button>
              </div>

              {/* Requirement 1.2: Datebox Picker */}
              <div className="flex items-center gap-1.5 bg-white border border-stone-300 px-3 py-1.5 rounded-xl shadow-sm">
                <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">Datebox:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedDate(val);
                    if (val) {
                      const d = new Date(val);
                      setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                    }
                  }}
                  className="text-xs font-mono font-bold text-stone-900 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Monthly Interactive Calendar View (Requirement 1.3) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-stone-900">
                {monthNames[month]} {year}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600"
                  title="Bulan Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600"
                  title="Bulan Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-stone-400 uppercase">
              <span>Min</span>
              <span>Sen</span>
              <span>Sel</span>
              <span>Rab</span>
              <span>Kam</span>
              <span>Jum</span>
              <span>Sab</span>
            </div>

            {/* Monthly Calendar Grid with Red/Full Booked highlight (Requirement 1.3) */}
            <div className="grid grid-cols-7 gap-1.5">
              {/* Empty padding days */}
              {Array.from({ length: startingDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-10 rounded-xl" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = selectedDate === dStr;
                const isToday = todayStr === dStr;

                const dayBookings = getBookingsOnDate(dStr);
                const bookedCount = dayBookings.length;
                const isDayFull = rooms.length > 0 && bookedCount >= rooms.length;
                const isDayPartial = bookedCount > 0 && !isDayFull;

                return (
                  <button
                    key={dStr}
                    type="button"
                    onClick={() => setSelectedDate(dStr)}
                    className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between transition-all relative font-mono text-xs ${
                      isSelected
                        ? 'ring-2 ring-stone-900 ring-offset-2 z-10 shadow-md'
                        : ''
                    } ${
                      isDayFull
                        ? 'bg-red-500 text-white font-bold hover:bg-red-600 shadow-sm'
                        : isDayPartial
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 font-semibold'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200/60'
                    }`}
                  >
                    <span className="text-[11px] font-bold">{dayNum}</span>
                    <span className="text-[8px] leading-tight">
                      {isDayFull ? 'HABIS' : isDayPartial ? `${bookedCount}/${rooms.length}` : 'KOSONG'}
                    </span>
                    {isToday && (
                      <span className="w-1 h-1 rounded-full bg-emerald-500 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px] text-stone-500">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-red-500 inline-block" />
                <span>Merah: Kamar Habis (Full)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-200 border border-amber-400 inline-block" />
                <span>Kuning: Sebagian Terisi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-stone-100 border border-stone-300 inline-block" />
                <span>Abu: Kosong</span>
              </div>
            </div>
          </div>

          {/* Right Column: Selected Date Drilldown Inspector (Requirement 1.3 & 1.4) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Status Banner for the chosen date */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isSelectedDateFullBooked
                  ? 'bg-red-50 border-red-300 text-red-900'
                  : bookingsOnSelectedDate.length > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {isSelectedDateFullBooked ? (
                    <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                  ) : bookingsOnSelectedDate.length > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                      {isSelectedDateFullBooked
                        ? 'TANGGAL MERAH — SELURUH KAMAR HABIS DIBOOKING'
                        : bookingsOnSelectedDate.length > 0
                        ? `SEBAGIAN KAMAR TERISI (${bookingsOnSelectedDate.length}/${rooms.length} KABIN)`
                        : 'SEMUA KAMAR KOSONG & SIAP MENERIMA TAMU'}
                    </h3>
                    <div className="text-xs font-semibold mt-0.5">
                      Tanggal Dipilih: {formatDateWIB(new Date(selectedDate))} ({selectedDate})
                    </div>
                  </div>
                </div>

                <Badge
                  variant={isSelectedDateFullBooked ? 'danger' : bookingsOnSelectedDate.length > 0 ? 'warning' : 'success'}
                  size="sm"
                >
                  {isSelectedDateFullBooked
                    ? 'FULL BOOKED'
                    : bookingsOnSelectedDate.length > 0
                    ? `${availableRoomsDetail.length} Kamar Tersisa`
                    : '100% KOSONG'}
                </Badge>
              </div>
            </div>

            {/* Split Details: Booked Rooms vs Available Rooms (Requirement 1.4) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Section 1: Kamar yang Telah Di-Booking (Requirement 1.4) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                  <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <span>Kamar Dipesan ({bookedRoomsDetail.length})</span>
                  </span>
                </div>

                {bookedRoomsDetail.length === 0 ? (
                  <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl text-center text-xs text-stone-500">
                    Tidak ada pesanan aktif pada tanggal ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {bookedRoomsDetail.map(({ room, booking }) => (
                      <div
                        key={room.id}
                        className="p-3 bg-red-50/60 border border-red-200 rounded-xl text-xs space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between font-bold text-stone-900">
                          <span>{room.room_name} ({room.room_number})</span>
                          <span className="font-mono text-red-700 text-[11px]">{booking?.booking_code}</span>
                        </div>

                        {booking && (
                          <div className="space-y-1 text-stone-600 text-[11px]">
                            <div className="flex items-center justify-between">
                              <span className="text-stone-500">Nama Tamu:</span>
                              <span className="font-semibold text-stone-900">{booking.guest_name}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-stone-500">No. WhatsApp:</span>
                              <a
                                href={generateWhatsAppLink(booking.guest_phone, `Halo Bapak/Ibu ${booking.guest_name}, konfirmasi reservasi ${booking.booking_code}`)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-emerald-700 hover:underline flex items-center gap-1"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>{booking.guest_phone}</span>
                              </a>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-stone-500">Jadwal:</span>
                              <span>{booking.check_in_date} s/d {booking.check_out_date}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-stone-500">Jumlah Tamu:</span>
                              <span>{booking.adult_count} Dewasa, {(booking.teen_count || 0) + (booking.child_count || 0)} Anak</span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-red-200">
                              <span className="text-stone-500">Status Bayar:</span>
                              <Badge
                                variant={booking.payment_status === 'paid' ? 'success' : booking.payment_status === 'down_payment' ? 'warning' : 'danger'}
                                size="sm"
                              >
                                {booking.payment_status === 'paid' ? 'Lunas' : booking.payment_status === 'down_payment' ? 'DP' : 'Belum Lunas'}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 2: Kamar yang Masih Kosong (Requirement 1.4) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-stone-200">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Kamar Masih Kosong ({availableRoomsDetail.length})</span>
                  </span>
                </div>

                {availableRoomsDetail.length === 0 ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center text-xs text-red-700 font-semibold">
                    Semua kamar terisi penuh pada tanggal ini.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {availableRoomsDetail.map((room) => (
                      <div
                        key={room.id}
                        className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-1.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between font-bold text-stone-900">
                          <span>{room.room_name} ({room.room_number})</span>
                          <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-100 px-2 py-0.5 rounded">
                            Tersedia
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-600 flex justify-between">
                          <span>Kapasitas: Maks {room.capacity} Orang</span>
                          <span className="font-mono font-bold text-stone-800">{formatRupiah(room.price_per_night)} / org</span>
                        </div>
                        <div className="pt-1.5 border-t border-emerald-200 flex justify-end">
                          <Link href={`/admin/pesanan-penginapan?roomId=${room.id}&date=${selectedDate}`}>
                            <button
                              type="button"
                              className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              <span>Booking Tanggal Ini</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Payment Channels & Critical Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payments Breakdown */}
        <Card className="lg:col-span-1">
          <CardHeader title="Penerimaan Kas Hari Ini" subtitle="Berdasarkan kanal pembayaran aktual" />
          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-stone-700">Cash / Tunai</span>
              </div>
              <span className="text-sm font-bold text-stone-900">{formatRupiah(todayCash)}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                <span className="text-xs font-semibold text-stone-700">QRIS</span>
              </div>
              <span className="text-sm font-bold text-stone-900">{formatRupiah(todayQris)}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="text-xs font-semibold text-stone-700">Transfer Bank</span>
              </div>
              <span className="text-sm font-bold text-stone-900">{formatRupiah(todayTransfer)}</span>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-stone-800">
              <span>Total Diterima:</span>
              <span className="text-sm text-emerald-700">{formatRupiah(todayCash + todayQris + todayTransfer)}</span>
            </div>
          </div>
        </Card>

        {/* Critical Meat Stock Warning */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Peringatan Stok Daging Kritis</span>
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">Item inventori yang berada di bawah ambang batas minimum</p>
            </div>
            <Link href="/admin/inventory">
              <Button variant="ghost" size="sm">
                Lihat Semua Stok
              </Button>
            </Link>
          </div>

          {criticalStockItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-emerald-700 bg-emerald-50/60 rounded-lg border border-emerald-200">
              Semua saldo daging dan bahan saat ini dalam status aman (di atas batas minimum).
            </div>
          ) : (
            <div className="divide-y divide-stone-100 max-h-60 overflow-y-auto">
              {criticalStockItems.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-800">{item.item_name}</span>
                    <span className="text-stone-400 ml-2">({item.category === 'raw_meat' ? 'Mentah' : 'Matang'})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-red-600 font-bold">{formatGram(item.stock_gram)}</span>
                    <span className="text-stone-400">Min: {formatGram(item.minimum_stock_gram)}</span>
                    <Badge variant="danger" size="sm">
                      Kritis
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Unpaid / Down-Payment Orders & Recent Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unpaid / Down-Payment Orders */}
        <Card>
          <div className="flex items-center justify-between mb-4 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-stone-900">Pembayaran Belum Lunas</h3>
              <p className="text-xs text-stone-500 mt-0.5">Pesanan aktif yang memerlukan pelunasan kasir</p>
            </div>
            <Link href="/admin/order-history">
              <Button variant="ghost" size="sm">
                Lihat Pesanan
              </Button>
            </Link>
          </div>

          {unpaidOrders.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Semua Tagihan Lunas"
              description="Tidak ada transaksi yang masih berstatus Belum Lunas atau Down Payment."
            />
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto">
              {unpaidOrders.slice(0, 5).map((ord) => (
                <div key={ord.id} className="p-3 bg-stone-50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-900">{ord.guest_name}</span>
                    <span className="font-mono text-stone-400 ml-2">({ord.booking_code})</span>
                    <div className="text-stone-500 mt-0.5">
                      Total: {formatRupiah(ord.total_amount)} • Terbayar: {formatRupiah(ord.paid_amount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">Sisa: {formatRupiah(ord.remaining_amount)}</div>
                    <Badge variant={ord.payment_status === 'down_payment' ? 'warning' : 'danger'} size="sm" className="mt-1">
                      {ord.payment_status === 'down_payment' ? 'DP Terbayar' : 'Belum Lunas'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Activity Log */}
        <Card>
          <CardHeader title="Aktivitas Operasional Terbaru" subtitle="Transaksi dan pesanan terakhir yang terekam di sistem" />
          {orders.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="Belum Ada Transaksi"
              description="Mulai catat transaksi pertama melalui POS Restoran atau Pemesanan Penginapan."
            />
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {orders.slice(0, 5).map((ord) => (
                <div key={ord.id} className="p-2.5 bg-stone-50 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-stone-900">{ord.guest_name}</div>
                    <div className="text-[11px] text-stone-500 font-mono">
                      {ord.booking_code} • {ord.order_type.toUpperCase()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-stone-900">{formatRupiah(ord.total_amount)}</div>
                    <Badge
                      variant={
                        ord.payment_status === 'paid'
                          ? 'success'
                          : ord.payment_status === 'down_payment'
                          ? 'warning'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {ord.payment_status === 'paid' ? 'Lunas' : ord.payment_status === 'down_payment' ? 'DP' : 'Belum Lunas'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
