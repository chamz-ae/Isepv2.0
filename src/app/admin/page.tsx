'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  PlusCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Phone,
  MessageSquare,
  Eye,
  Search,
  LayoutGrid,
  ChevronDown,
  ChevronUp,
  MapPin,
  Globe,
  UserCheck,
  Truck,
  ShoppingBag,
  Scale,
  ClipboardCheck,
  BarChart3,
  Image as ImageIcon,
  Settings,
  Sparkles,
  ChefHat,
  DoorOpen,
  Lock,
} from 'lucide-react';
import { getOrders } from '@/lib/services/orderService';
import { getRooms, getTables } from '@/lib/services/roomService';
import { getInventoryItems } from '@/lib/services/inventoryService';
import { Order, Room, RestaurantTable, InventoryItem } from '@/lib/supabase/types';
import {
  formatRupiah,
  formatGram,
  formatDateTimeWIB,
  formatDateWIB,
  generateWhatsAppLink,
} from '@/lib/utils/formatters';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Today's date reference
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Lodging-specific date selection (Requirement: Date picker is strictly for Penginapan)
  const [lodgingSelectedDate, setLodgingSelectedDate] = useState<string>(todayStr);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  const [kabinViewMode, setKabinViewMode] = useState<'timeline' | 'calendar'>('timeline');

  // Orders table view states (Requirement 1.1: Live orders for today)
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'restaurant' | 'lodging' | 'combined'>('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>('');
  const [selectedDetailOrder, setSelectedDetailOrder] = useState<Order | null>(null);

  // Restaurant reservation filter in the reservation alert/box
  const [selectedRestoResDate, setSelectedRestoResDate] = useState<string>('all');

  // Module launcher drawer toggle
  const [isModuleGridOpen, setIsModuleGridOpen] = useState(false);
  const [activeModuleFilter, setActiveModuleFilter] = useState<'all' | 'operasional' | 'inventori' | 'master' | 'sistem'>('all');

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

    // Auto-sync across customer order placements and tabs
    const handleUpdate = () => loadData();
    window.addEventListener('asap_orders_updated', handleUpdate);
    window.addEventListener('asap_inventory_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('asap_orders_updated', handleUpdate);
      window.removeEventListener('asap_inventory_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // ----------------------------------------------------------------------
  // 1. ORDERS FOR TODAY (Live Today - Requirement 1.1)
  // ----------------------------------------------------------------------
  const ordersToday = useMemo(() => {
    return orders.filter((o) => {
      if (o.order_status === 'cancelled') return false;
      const createdDate = o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : '';

      if (o.order_type === 'restaurant') {
        return createdDate === todayStr;
      }

      // Lodging & combined orders: active if staying today OR created today
      const isStayingToday =
        o.check_in_date &&
        o.check_out_date &&
        o.check_in_date <= todayStr &&
        o.check_out_date >= todayStr;

      return isStayingToday || createdDate === todayStr;
    });
  }, [orders, todayStr]);

  // Filtered orders for today's table display
  const filteredOrdersToday = useMemo(() => {
    return ordersToday.filter((o) => {
      if (orderTypeFilter !== 'all') {
        if (orderTypeFilter === 'restaurant' && o.order_type !== 'restaurant') return false;
        if (orderTypeFilter === 'lodging' && o.order_type !== 'lodging') return false;
        if (orderTypeFilter === 'combined' && o.order_type !== 'combined') return false;
      }

      if (orderStatusFilter !== 'all' && o.order_status !== orderStatusFilter) {
        return false;
      }

      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase();
        const codeMatch = o.booking_code.toLowerCase().includes(q);
        const nameMatch = o.guest_name.toLowerCase().includes(q);
        const phoneMatch = o.guest_phone.toLowerCase().includes(q);
        const roomMatch = o.room_name_snapshot?.toLowerCase().includes(q);
        const tableMatch = o.table_number_snapshot?.toLowerCase().includes(q);
        return codeMatch || nameMatch || phoneMatch || roomMatch || tableMatch;
      }

      return true;
    });
  }, [ordersToday, orderTypeFilter, orderStatusFilter, orderSearchQuery]);

  // Today's statistics
  const statsToday = useMemo(() => {
    const totalRevenue = ordersToday.reduce((acc, o) => acc + (o.paid_amount || 0), 0);
    const totalTransactions = ordersToday.length;
    const totalVisitors = ordersToday.reduce((acc, o) => {
      if (o.order_type === 'lodging' || o.order_type === 'combined') {
        return acc + (o.adult_count || 1) + (o.teen_count || 0) + (o.child_count || 0);
      }
      return acc + 1;
    }, 0);

    return { totalRevenue, totalTransactions, totalVisitors };
  }, [ordersToday]);

  // ----------------------------------------------------------------------
  // 2. RESTAURANT RESERVATIONS ALERT / BOX
  // ----------------------------------------------------------------------
  const restaurantReservations = useMemo(() => {
    return orders
      .filter((o) => {
        if (o.order_status === 'cancelled') return false;
        const isRestoOrCombined = o.order_type === 'restaurant' || o.order_type === 'combined';
        // Tables assigned or notes mentioning reservation or dining
        return isRestoOrCombined && (o.table_id || o.table_number_snapshot || o.notes?.toLowerCase().includes('reservasi'));
      })
      .map((o) => {
        const orderDate = o.check_in_date || (o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : todayStr);
        const orderTime = o.created_at
          ? new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
          : '-';
        const isFromWebsite =
          o.operator_name?.toLowerCase().includes('online') ||
          !o.operator_name ||
          o.operator_name === 'Online Customer';

        const matchedTable = tables.find((t) => t.id === o.table_id || t.table_number === o.table_number_snapshot);
        const tableLabel = o.table_number_snapshot
          ? `Meja ${o.table_number_snapshot}`
          : matchedTable
          ? `Meja ${matchedTable.table_number}`
          : 'Meja Resto';

        return {
          order: o,
          reservationDate: orderDate,
          reservationTime: orderTime,
          tableLabel,
          tableLocation: matchedTable?.location_notes || 'Area Makan Resto',
          guestName: o.guest_name,
          guestPhone: o.guest_phone,
          isFromWebsite,
          itemCount: o.order_items?.length || 0,
          totalAmount: o.total_amount,
          status: o.order_status,
          paymentStatus: o.payment_status,
        };
      })
      .sort((a, b) => b.reservationDate.localeCompare(a.reservationDate));
  }, [orders, tables, todayStr]);

  // Grouped reservations by date
  const uniqueReservedDates = useMemo(() => {
    const datesMap = new Map<string, typeof restaurantReservations>();
    for (const r of restaurantReservations) {
      const arr = datesMap.get(r.reservationDate) || [];
      arr.push(r);
      datesMap.set(r.reservationDate, arr);
    }
    return Array.from(datesMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [restaurantReservations]);

  const filteredReservations = useMemo(() => {
    if (selectedRestoResDate === 'all') return restaurantReservations;
    return restaurantReservations.filter((r) => r.reservationDate === selectedRestoResDate);
  }, [restaurantReservations, selectedRestoResDate]);

  // ----------------------------------------------------------------------
  // 3. JADWAL KABIN INAP LOGIC (Strictly for Penginapan - Requirement 1.2)
  // ----------------------------------------------------------------------
  const getBookingsOnDate = (dateStr: string) => {
    return orders.filter((o) => {
      if (o.order_status === 'cancelled') return false;
      if (!o.check_in_date || !o.check_out_date || !o.room_id) return false;
      // If check-in and check-out are on the same day (day use / same day)
      if (o.check_in_date === o.check_out_date) {
        return o.check_in_date === dateStr;
      }
      // Occupies room from check_in_date up to check_out_date (inclusive of check-out day)
      return o.check_in_date <= dateStr && o.check_out_date >= dateStr;
    });
  };

  const getBookingStayLabel = (b: Order, dateStr: string) => {
    if (b.check_in_date === b.check_out_date) return 'Day-Use';
    if (b.check_in_date === dateStr) return 'Check-In';
    if (b.check_out_date === dateStr) return 'Check-Out';
    return 'Menginap';
  };

  const bookingsOnLodgingDate = getBookingsOnDate(lodgingSelectedDate);
  const bookedRoomIdsOnLodging = new Set(bookingsOnLodgingDate.map((b) => b.room_id));

  const bookedRoomsDetail = rooms
    .filter((r) => bookedRoomIdsOnLodging.has(r.id))
    .map((r) => {
      const booking = bookingsOnLodgingDate.find((b) => b.room_id === r.id);
      return { room: r, booking };
    });

  const availableRoomsDetail = rooms.filter((r) => !bookedRoomIdsOnLodging.has(r.id));
  const isLodgingDateFullBooked = rooms.length > 0 && availableRoomsDetail.length === 0;

  // Occupancy for Today (for KPI Card)
  const bookingsToday = getBookingsOnDate(todayStr);
  const bookedRoomIdsToday = new Set(bookingsToday.map((b) => b.room_id));

  // Generate 7 rolling days starting from lodgingSelectedDate for Timeline Matrix
  const rollingDays = useMemo(() => {
    const days: { dateStr: string; dayName: string; dayNum: number; isSelected: boolean; isToday: boolean }[] = [];
    const base = new Date(lodgingSelectedDate);
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const str = d.toISOString().slice(0, 10);
      days.push({
        dateStr: str,
        dayName: dayNames[d.getDay()],
        dayNum: d.getDate(),
        isSelected: str === lodgingSelectedDate,
        isToday: str === todayStr,
      });
    }
    return days;
  }, [lodgingSelectedDate, todayStr]);

  // Quick date helper for lodging
  const handleQuickLodgingDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const str = d.toISOString().slice(0, 10);
    setLodgingSelectedDate(str);
    setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // Payments breakdown for today
  let todayCash = 0;
  let todayQris = 0;
  let todayTransfer = 0;

  for (const o of ordersToday) {
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

  // Table status counts
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length;
  const availableTables = tables.filter((t) => t.status === 'available').length;

  // Critical stock items
  const criticalStockItems = inventory.filter(
    (item) => item.is_active && item.stock_gram <= item.minimum_stock_gram
  );

  // Month grid generator for calendar view
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay();

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(year, month + 1, 1));
  };

  // Operational Modules Directory for Drawer
  const operationalModules = [
    { href: '/admin/pos', title: 'POS Kasir Resto', desc: 'Kasir & struk pesanan meja', icon: CreditCard, category: 'operasional', iconBg: 'bg-amber-100 text-amber-800' },
    { href: '/admin/kds', title: 'KDS Smokehouse', desc: 'Kitchen display pesanan & antrean', icon: ChefHat, category: 'operasional', iconBg: 'bg-orange-100 text-orange-800' },
    { href: '/admin/pesanan-restoran', title: 'Input Pesanan Resto', desc: 'Buat order resto baru', icon: PlusCircle, category: 'operasional', iconBg: 'bg-emerald-100 text-emerald-800' },
    { href: '/admin/pesanan-penginapan', title: 'Input Booking Inap', desc: 'Reservasi kabin & kalkulasi tamu', icon: BedDouble, category: 'operasional', iconBg: 'bg-sky-100 text-sky-800' },
    { href: '/admin/kamar', title: 'Kamar & Kabin', desc: 'Master kamar & kapasitas tamu', icon: DoorOpen, category: 'master', iconBg: 'bg-emerald-100 text-emerald-800' },
    { href: '/admin/meja', title: 'Daftar Meja', desc: 'Kelola meja, kapasitas & status', icon: UtensilsCrossed, category: 'master', iconBg: 'bg-amber-100 text-amber-800', badge: 'CRUD Meja' },
    { href: '/admin/menu', title: 'Daftar Menu Daging', desc: 'Katalog smoked meat & harga', icon: UtensilsCrossed, category: 'master', iconBg: 'bg-orange-100 text-orange-800' },
    { href: '/admin/tamu', title: 'Buku Tamu (CRM)', desc: 'Riwayat kunjungan & loyalitas', icon: Users, category: 'master', iconBg: 'bg-indigo-100 text-indigo-800' },
    { href: '/admin/kasir-closing', title: 'Tutup Kasir Harian', desc: 'Rekonsiliasi kas, laci & selisih', icon: Lock, category: 'operasional', iconBg: 'bg-purple-100 text-purple-800' },
    { href: '/admin/suppliers', title: 'Data Supplier', desc: 'Mitra pasokan daging & belanja', icon: Truck, category: 'master', iconBg: 'bg-stone-200 text-stone-800' },
    { href: '/admin/purchasing', title: 'Belanja Daging', desc: 'Faktur & PO pembelian bahan', icon: ShoppingBag, category: 'inventori', iconBg: 'bg-teal-100 text-teal-800' },
    { href: '/admin/inventory', title: 'Stok Daging Live', desc: 'Live saldo & potong manual event', icon: Boxes, category: 'inventori', iconBg: 'bg-emerald-100 text-emerald-800', badge: 'Live & Potong' },
    { href: '/admin/cooking', title: 'Cooking Yield Rate', desc: 'Susut pengasapan & yield rate', icon: Scale, category: 'inventori', iconBg: 'bg-amber-100 text-amber-800' },
    { href: '/admin/stock-opname', title: 'Stock Opname', desc: 'Cek fisik vs sistem selisih', icon: ClipboardCheck, category: 'inventori', iconBg: 'bg-cyan-100 text-cyan-800' },
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
      {/* ================================================================== */}
      {/* TOP HEADER: Clean Dashboard Title & Live Today Info               */}
      {/* (Date picker removed from here as per revision)                    */}
      {/* ================================================================== */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">Dashboard Operasional</h1>
            <Badge variant="amber" size="sm">
              Live System
            </Badge>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Data operasional live food forest smokehouse, pesanan harian, jadwal kabin inap terisi, dan stok daging.
          </p>
        </div>

        {/* Live Date Indicator & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200/80 px-3 py-1.5 rounded-xl shadow-xs">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-mono font-bold text-stone-800">
              Hari Ini: {formatDateWIB(todayStr)}
            </span>
          </div>

          <Link href="/admin/pesanan-restoran">
            <Button variant="amber" size="sm" className="font-semibold shadow-xs">
              <PlusCircle className="w-4 h-4 mr-1" />
              <span>POS Resto</span>
            </Button>
          </Link>
          <Link href="/admin/pesanan-penginapan">
            <Button variant="outline" size="sm" className="font-semibold shadow-xs">
              <BedDouble className="w-4 h-4 mr-1 text-stone-600" />
              <span>Booking Inap</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* ================================================================== */}
      {/* PRIMARY KPI METRICS (Live for Today)                               */}
      {/* ================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-white to-stone-50 p-4 border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Omzet Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900 tracking-tight">
            {formatRupiah(statsToday.totalRevenue)}
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {formatDateWIB(todayStr)} ({ordersToday.length} transaksi live)
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-stone-50 p-4 border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Tamu & Pengunjung Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900 tracking-tight">
            {statsToday.totalVisitors} <span className="text-sm font-normal text-stone-500">Orang</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">Tamu menginap & bersantap hari ini</p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-stone-50 p-4 border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Kamar Kabin Terisi Hari Ini</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <BedDouble className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900 tracking-tight">
            {bookedRoomIdsToday.size} <span className="text-sm font-normal text-stone-500">/ {rooms.length} Terisi</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {rooms.length - bookedRoomIdsToday.size} Kabin Kosong Hari Ini
          </p>
        </Card>

        <Card className="bg-gradient-to-br from-white to-stone-50 p-4 border border-stone-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-500">Meja Restoran</span>
            <div className="w-8 h-8 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-stone-900 tracking-tight">
            {availableTables} <span className="text-sm font-normal text-stone-500">Kosong</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1">
            {occupiedTables} Terisi • Total {tables.length} Meja Terdaftar
          </p>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* SECTION 1: TAMPILAN PESANAN HARI INI (Live Hari Ini Sesuai Tanggal) */}
      {/* ================================================================== */}
      <Card className="border-stone-300 shadow-sm bg-white overflow-hidden">
        <div className="p-4 border-b border-stone-200 bg-stone-50/70">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h2 className="text-base font-bold text-stone-900">
                  Daftar Pesanan Hari Ini ({formatDateWIB(todayStr)})
                </h2>
                <Badge variant="success" size="sm">
                  Live Hari Ini
                </Badge>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Monitoring seluruh pesanan live restoran, kabin inap yang aktif hari ini, dan rincian transaksi kasir.
              </p>
            </div>

            {/* Filter Pills & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 text-xs">
                <button
                  type="button"
                  onClick={() => setOrderTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                    orderTypeFilter === 'all' ? 'bg-stone-900 text-white font-bold' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Semua ({ordersToday.length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderTypeFilter('restaurant')}
                  className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                    orderTypeFilter === 'restaurant' ? 'bg-amber-600 text-white font-bold' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Restoran ({ordersToday.filter((o) => o.order_type === 'restaurant').length})
                </button>
                <button
                  type="button"
                  onClick={() => setOrderTypeFilter('lodging')}
                  className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-colors ${
                    orderTypeFilter === 'lodging' ? 'bg-emerald-600 text-white font-bold' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Inap ({ordersToday.filter((o) => o.order_type === 'lodging' || o.order_type === 'combined').length})
                </button>
              </div>

              {/* Status Select */}
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="px-2.5 py-1 text-xs border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="completed">Completed</option>
              </select>

              {/* Search box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Cari tamu / kode..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs border border-stone-200 rounded-lg focus:outline-none w-36 sm:w-44 bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrdersToday.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              icon={FileText}
              title={`Tidak Ada Pesanan pada Hari Ini (${formatDateWIB(todayStr)})`}
              description="Belum ada transaksi restoran atau booking kamar yang terdaftar untuk hari ini."
              action={
                <div className="flex items-center gap-2 justify-center mt-3">
                  <Link href="/admin/pesanan-restoran">
                    <Button variant="amber" size="sm">
                      <PlusCircle className="w-4 h-4 mr-1" />
                      <span>Input Pesanan Resto</span>
                    </Button>
                  </Link>
                  <Link href="/admin/pesanan-penginapan">
                    <Button variant="outline" size="sm">
                      <BedDouble className="w-4 h-4 mr-1" />
                      <span>Input Booking Inap</span>
                    </Button>
                  </Link>
                </div>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 text-stone-700 uppercase font-semibold text-[10px] tracking-wider border-b border-stone-200">
                <tr>
                  <th className="px-4 py-3">Waktu & Kode</th>
                  <th className="px-4 py-3">Tipe & Lokasi</th>
                  <th className="px-4 py-3">Tamu / Pelanggan</th>
                  <th className="px-4 py-3">Rincian Item / Kamar</th>
                  <th className="px-4 py-3">Status Dapur</th>
                  <th className="px-4 py-3">Pembayaran</th>
                  <th className="px-4 py-3 text-right">Total Tagihan</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredOrdersToday.map((ord) => {
                  const isResto = ord.order_type === 'restaurant';
                  const isLodging = ord.order_type === 'lodging' || ord.order_type === 'combined';

                  return (
                    <tr key={ord.id} className="hover:bg-stone-50 transition-colors">
                      {/* Waktu & Kode */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-stone-900 block">{ord.booking_code}</span>
                        <span className="text-[10px] text-stone-400">
                          {ord.created_at ? new Date(ord.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WIB
                        </span>
                      </td>

                      {/* Tipe & Lokasi */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={isResto ? 'amber' : ord.order_type === 'combined' ? 'info' : 'success'}
                            size="sm"
                          >
                            {ord.order_type.toUpperCase()}
                          </Badge>
                        </div>
                        <span className="text-[11px] font-semibold text-stone-800 block mt-0.5">
                          {isResto && (ord.table_number_snapshot ? `Meja ${ord.table_number_snapshot}` : 'Takeaway')}
                          {isLodging && (ord.room_name_snapshot ? ord.room_name_snapshot : 'Kabin Inap')}
                        </span>
                      </td>

                      {/* Tamu */}
                      <td className="px-4 py-3">
                        <span className="font-bold text-stone-900 block">{ord.guest_name}</span>
                        {ord.guest_phone && (
                          <a
                            href={generateWhatsAppLink(ord.guest_phone, `Halo Bapak/Ibu ${ord.guest_name}, mengenai pesanan ${ord.booking_code} di ASAP ISEP`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-mono"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{ord.guest_phone}</span>
                          </a>
                        )}
                      </td>

                      {/* Rincian Item */}
                      <td className="px-4 py-3 max-w-xs">
                        {ord.order_items && ord.order_items.length > 0 ? (
                          <div className="space-y-0.5">
                            {ord.order_items.slice(0, 2).map((it, idx) => (
                              <div key={idx} className="text-[11px] text-stone-700 truncate">
                                • {it.menu_name_snapshot} ({it.qty}x)
                              </div>
                            ))}
                            {ord.order_items.length > 2 && (
                              <span className="text-[10px] text-stone-400">+{ord.order_items.length - 2} menu lainnya</span>
                            )}
                          </div>
                        ) : isLodging ? (
                          <span className="text-[11px] text-stone-600">
                            {ord.adult_count} Dewasa, {(ord.teen_count || 0) + (ord.child_count || 0)} Anak ({ord.check_in_date} s/d {ord.check_out_date})
                          </span>
                        ) : (
                          <span className="text-[11px] text-stone-400">-</span>
                        )}
                      </td>

                      {/* Status Order */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge
                          variant={
                            ord.order_status === 'completed'
                              ? 'success'
                              : ord.order_status === 'ready'
                              ? 'info'
                              : ord.order_status === 'preparing'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {ord.order_status.toUpperCase()}
                        </Badge>
                      </td>

                      {/* Status Bayar */}
                      <td className="px-4 py-3 whitespace-nowrap">
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
                          {ord.payment_status === 'paid' ? 'LUNAS' : ord.payment_status === 'down_payment' ? 'DP' : 'BELUM LUNAS'}
                        </Badge>
                        {ord.payment_status !== 'paid' && (
                          <span className="text-[10px] text-red-600 block mt-0.5 font-bold">
                            Sisa: {formatRupiah(ord.remaining_amount)}
                          </span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-right whitespace-nowrap font-mono font-bold text-stone-900">
                        {formatRupiah(ord.total_amount)}
                      </td>

                      {/* Aksi */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDetailOrder(ord)}
                          className="h-7 px-2 text-[11px]"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          <span>Detail</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ================================================================== */}
      {/* SECTION 2: ALERT / BOX JADWAL RESERVASI MEJA RESTORAN (Revision)   */}
      {/* "restoran hanya berikan alert atau box untuk tanggal tanggal       */}
      {/*  yang telah di reservasi melalui website customer atau manual"    */}
      {/* ================================================================== */}
      <Card className="border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-amber-200/70 bg-amber-100/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center shrink-0 shadow-xs">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-stone-900">
                    Jadwal & Riwayat Reservasi Meja Restoran
                  </h2>
                  <Badge variant="amber" size="sm">
                    {restaurantReservations.length} Reservasi Aktif
                  </Badge>
                </div>
                <p className="text-xs text-stone-600 mt-0.5">
                  Menampilkan tanggal-tanggal dan meja yang telah direservasi oleh pelanggan dari website maupun input manual staf di dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/admin/pesanan-restoran">
                <Button variant="amber" size="sm" className="font-semibold text-xs shadow-xs">
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  <span>+ Reservasi Meja Baru</span>
                </Button>
              </Link>
              <Link href="/admin/meja">
                <Button variant="outline" size="sm" className="text-xs">
                  <span>Kelola Meja ({tables.length})</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Date Tabs for Restaurant Reservations */}
          {uniqueReservedDates.length > 0 && (
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-amber-200/60 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider shrink-0 mr-1">
                Filter Tanggal Reservasi:
              </span>
              <button
                type="button"
                onClick={() => setSelectedRestoResDate('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedRestoResDate === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-white/80 text-stone-700 hover:bg-white border border-stone-200/80'
                }`}
              >
                Semua Tanggal ({restaurantReservations.length})
              </button>
              {uniqueReservedDates.map(([dateStr, items]) => {
                const isSelected = selectedRestoResDate === dateStr;
                const isToday = dateStr === todayStr;
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => setSelectedRestoResDate(dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white/80 text-stone-700 hover:bg-white border border-stone-200/80'
                    }`}
                  >
                    <span>{formatDateWIB(dateStr)}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isSelected ? 'bg-amber-700 text-white' : 'bg-amber-100 text-amber-800'}`}>
                      {items.length} Meja
                    </span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Box */}
        <div className="p-4">
          {restaurantReservations.length === 0 ? (
            <div className="p-6 text-center bg-white/70 rounded-2xl border border-amber-200/60">
              <UtensilsCrossed className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-70" />
              <div className="font-bold text-stone-800 text-sm">
                Belum Ada Meja yang Direservasi
              </div>
              <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                Semua meja restoran berstatus standby. Pemesanan meja yang masuk melalui website customer atau dibuat manual via kasir POS akan otomatis muncul di box ini.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Link href="/admin/pesanan-restoran">
                  <Button variant="amber" size="sm">
                    <PlusCircle className="w-4 h-4 mr-1" />
                    <span>Buat Reservasi Meja</span>
                  </Button>
                </Link>
                <Link href="/admin/meja">
                  <Button variant="outline" size="sm">
                    <span>Lihat Denah & Status Meja</span>
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredReservations.map((res) => {
                const isToday = res.reservationDate === todayStr;
                return (
                  <div
                    key={res.order.id}
                    className="p-3.5 bg-white rounded-xl border border-stone-200 hover:border-amber-400 transition-all shadow-xs space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-stone-900 text-sm">
                            {res.tableLabel}
                          </span>
                          <span className="text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                            {res.tableLocation}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                          Kode: <span className="text-stone-700 font-bold">{res.order.booking_code}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <Badge variant={res.isFromWebsite ? 'success' : 'stone'} size="sm">
                          {res.isFromWebsite ? (
                            <span className="flex items-center gap-1">
                              <Globe className="w-3 h-3" />
                              <span>Website</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3 h-3" />
                              <span>Manual</span>
                            </span>
                          )}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-2.5 bg-stone-50 rounded-lg text-xs space-y-1 border border-stone-100">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500">Tamu / Pemesan:</span>
                        <span className="font-bold text-stone-900">{res.guestName}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500">Tanggal & Jam:</span>
                        <span className="font-semibold text-stone-800">
                          {formatDateWIB(res.reservationDate)} • {res.reservationTime} WIB
                        </span>
                      </div>
                      {res.guestPhone && (
                        <div className="flex justify-between items-center pt-1 border-t border-stone-200/60">
                          <span className="text-stone-500">WhatsApp:</span>
                          <a
                            href={generateWhatsAppLink(res.guestPhone, `Halo Bapak/Ibu ${res.guestName}, mengenai reservasi ${res.tableLabel} (${res.order.booking_code}) di ASAP ISEP`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-emerald-700 hover:underline flex items-center gap-1 font-bold text-[11px]"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>{res.guestPhone}</span>
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant={
                            res.paymentStatus === 'paid'
                              ? 'success'
                              : res.paymentStatus === 'down_payment'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {res.paymentStatus === 'paid' ? 'LUNAS' : res.paymentStatus === 'down_payment' ? 'DP' : 'BELUM BAYAR'}
                        </Badge>
                        <span className="text-xs font-mono font-bold text-stone-900">
                          {formatRupiah(res.totalAmount)}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedDetailOrder(res.order)}
                        className="h-7 px-2 text-[11px] text-stone-700 hover:text-amber-700"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        <span>Rincian</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* ================================================================== */}
      {/* SECTION 3: JADWAL KABIN INAP & OKUPANSI KAMAR (Penginapan Khusus)   */}
      {/* (Date picker specifically placed for Penginapan)                   */}
      {/* ================================================================== */}
      <Card className="border-stone-300 shadow-md">
        <div className="border-b border-stone-200 pb-4 mb-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-emerald-700" />
                <h2 className="text-lg font-bold text-stone-900">
                  Jadwal Kabin Inap & Okupansi Kamar
                </h2>
                <Badge variant="stone" size="sm">
                  Kapasitas & Jadwal Live
                </Badge>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Setiap kamar yang dipesan otomatis terisi dan memperbarui status terpakai/kosong sesuai rentang tanggal check-in dan check-out.
              </p>
            </div>

            {/* Lodging Date Picker & View Mode Controls (Strictly for Penginapan) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Date Pills */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickLodgingDate(0)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                    lodgingSelectedDate === todayStr ? 'bg-stone-900 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLodgingDate(1)}
                  className="px-2.5 py-1 rounded-lg font-semibold text-stone-600 hover:text-stone-900"
                >
                  Besok
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLodgingDate(7)}
                  className="px-2.5 py-1 rounded-lg font-semibold text-stone-600 hover:text-stone-900"
                >
                  +7 Hari
                </button>
              </div>

              {/* Datepicker Input */}
              <div className="flex items-center gap-1.5 bg-white border border-stone-300 px-3 py-1.5 rounded-xl shadow-xs">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <input
                  type="date"
                  value={lodgingSelectedDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLodgingSelectedDate(val);
                    if (val) {
                      const d = new Date(val);
                      setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                    }
                  }}
                  className="text-xs font-mono font-bold text-stone-900 bg-transparent focus:outline-none"
                />
              </div>

              {/* View Switcher: Timeline vs Calendar */}
              <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setKabinViewMode('timeline')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    kabinViewMode === 'timeline' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Timeline 7-Hari
                </button>
                <button
                  type="button"
                  onClick={() => setKabinViewMode('calendar')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                    kabinViewMode === 'calendar' ? 'bg-emerald-700 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Kalender Bulanan
                </button>
              </div>
            </div>
          </div>
        </div>

        {kabinViewMode === 'timeline' ? (
          /* ============================================================ */
          /* VIEW 1: TIMELINE MATRIX 7-HARI ROLLING                       */
          /* ============================================================ */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-stone-500 pb-2">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-red-500 inline-block" />
                  <span className="font-semibold text-stone-700">Kamar Terisi (Dipesan Tamu)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-stone-100 border border-stone-300 inline-block" />
                  <span className="font-semibold text-stone-700">Kamar Kosong (Tersedia)</span>
                </span>
              </div>
              <span className="font-mono text-[11px] text-stone-400">
                Pilih tanggal pada matriks untuk inspeksi detail kamar
              </span>
            </div>

            <div className="overflow-x-auto border border-stone-200 rounded-2xl">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-700 font-mono">
                  <tr>
                    <th className="p-3 w-48 font-bold border-r border-stone-200">Kamar / Kabin Inap</th>
                    {rollingDays.map((d) => (
                      <th
                        key={d.dateStr}
                        onClick={() => setLodgingSelectedDate(d.dateStr)}
                        className={`p-2.5 text-center cursor-pointer transition-colors border-r border-stone-200 last:border-r-0 ${
                          d.isSelected
                            ? 'bg-emerald-50 text-emerald-900 font-black ring-2 ring-emerald-500 ring-inset'
                            : d.isToday
                            ? 'bg-amber-50 text-amber-900 font-bold'
                            : 'hover:bg-stone-100'
                        }`}
                      >
                        <div className="text-[11px] uppercase">{d.dayName}</div>
                        <div className="text-base font-bold">{d.dayNum}</div>
                        {d.isToday && (
                          <span className="text-[9px] font-bold text-amber-700 block uppercase">Hari Ini</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 font-sans">
                  {rooms.map((room) => (
                    <tr key={room.id} className="hover:bg-stone-50/50">
                      <td className="p-3 border-r border-stone-200">
                        <div className="font-bold text-stone-900">{room.room_name}</div>
                        <div className="text-[11px] text-stone-500 font-mono">
                          {room.room_number} • Maks {room.capacity} Orang
                        </div>
                      </td>

                      {rollingDays.map((d) => {
                        const dayBookings = getBookingsOnDate(d.dateStr);
                        const booking = dayBookings.find((b) => b.room_id === room.id);
                        const isBooked = !!booking;

                        return (
                          <td
                            key={d.dateStr}
                            onClick={() => setLodgingSelectedDate(d.dateStr)}
                            className={`p-2 text-center border-r border-stone-200 last:border-r-0 cursor-pointer transition-all ${
                              d.isSelected ? 'bg-emerald-50/40' : ''
                            }`}
                          >
                            {isBooked ? (
                              <div
                                className="p-2 rounded-xl bg-red-500 text-white text-[11px] font-medium shadow-xs hover:bg-red-600 transition-colors"
                                title={`Dipesan: ${booking?.guest_name} (${booking?.check_in_date} s/d ${booking?.check_out_date})`}
                              >
                                <span className="font-bold block truncate max-w-[90px] mx-auto">
                                  {booking?.guest_name}
                                </span>
                                <div className="flex items-center justify-center gap-1 mt-0.5">
                                  <span className="text-[8px] bg-red-800/80 px-1 py-0.2 rounded font-bold uppercase whitespace-nowrap">
                                    {getBookingStayLabel(booking!, d.dateStr)}
                                  </span>
                                  <span className="text-[9px] opacity-90 font-mono truncate max-w-[55px]">
                                    {booking?.booking_code}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="p-2 rounded-xl bg-stone-100/80 hover:bg-emerald-100 text-stone-500 hover:text-emerald-800 transition-colors text-[11px] font-mono border border-dashed border-stone-300">
                                Kosong
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick Summary of Lodging Selected Date */}
            <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex flex-col sm:flex-row items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-stone-800">
                  Status Okupansi pada {formatDateWIB(lodgingSelectedDate)}:
                </span>
                <Badge
                  variant={isLodgingDateFullBooked ? 'danger' : bookingsOnLodgingDate.length > 0 ? 'warning' : 'success'}
                  size="sm"
                >
                  {bookedRoomsDetail.length} Terisi • {availableRoomsDetail.length} Tersedia
                </Badge>
              </div>
              <Link href={`/admin/pesanan-penginapan?checkInDate=${lodgingSelectedDate}`}>
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <PlusCircle className="w-3.5 h-3.5 mr-1" />
                  <span>Input Booking pada Tanggal Ini</span>
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* VIEW 2: KALENDER BULANAN & DETEKSI TANGGAL MERAH             */
          /* ============================================================ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between bg-stone-100 p-2 rounded-xl">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg hover:bg-stone-200 text-stone-700"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-stone-900 font-mono uppercase">
                  {calendarMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg hover:bg-stone-200 text-stone-700"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-[10px] font-bold text-stone-500 uppercase">
                <span>Min</span>
                <span>Sen</span>
                <span>Sel</span>
                <span>Rab</span>
                <span>Kam</span>
                <span>Jum</span>
                <span>Sab</span>
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: startingDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-11 rounded-xl bg-transparent" />
                ))}

                {Array.from({ length: daysInMonth }).map((_, idx) => {
                  const dayNum = idx + 1;
                  const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isSelected = lodgingSelectedDate === dStr;
                  const isToday = todayStr === dStr;

                  const dayBookings = getBookingsOnDate(dStr);
                  const bookedCount = dayBookings.length;
                  const isDayFull = rooms.length > 0 && bookedCount >= rooms.length;
                  const isDayPartial = bookedCount > 0 && !isDayFull;

                  return (
                    <button
                      key={dStr}
                      type="button"
                      onClick={() => setLodgingSelectedDate(dStr)}
                      className={`h-11 rounded-xl p-1 flex flex-col items-center justify-between transition-all relative font-mono text-xs ${
                        isSelected ? 'ring-2 ring-stone-900 ring-offset-2 z-10 shadow-md' : ''
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
                      {isToday && <span className="w-1 h-1 rounded-full bg-emerald-500 absolute top-1 right-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Detail Inspector */}
            <div className="lg:col-span-7 space-y-4">
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isLodgingDateFullBooked
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : bookingsOnLodgingDate.length > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {isLodgingDateFullBooked ? (
                      <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                    ) : bookingsOnLodgingDate.length > 0 ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider font-mono">
                        {isLodgingDateFullBooked
                          ? 'TANGGAL MERAH — SELURUH KAMAR TERISI PENUH'
                          : bookingsOnLodgingDate.length > 0
                          ? `SEBAGIAN KAMAR TERISI (${bookingsOnLodgingDate.length}/${rooms.length} KABIN)`
                          : 'SEMUA KAMAR KOSONG & SIAP MENERIMA TAMU'}
                      </h3>
                      <div className="text-xs font-semibold mt-0.5">
                        Tanggal Dipilih: {formatDateWIB(lodgingSelectedDate)} ({lodgingSelectedDate})
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant={isLodgingDateFullBooked ? 'danger' : bookingsOnLodgingDate.length > 0 ? 'warning' : 'success'}
                    size="sm"
                  >
                    {availableRoomsDetail.length} Kamar Kosong
                  </Badge>
                </div>
              </div>

              {/* Booked Rooms List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <span className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-stone-200">
                    <span className="w-2 h-2 rounded-full bg-red-600" />
                    <span>Kamar Sedang Digunakan ({bookedRoomsDetail.length})</span>
                  </span>

                  {bookedRoomsDetail.length === 0 ? (
                    <div className="p-4 bg-stone-50 border border-stone-200/80 rounded-xl text-center text-xs text-stone-500">
                      Tidak ada kabin terisi pada tanggal ini.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bookedRoomsDetail.map(({ room, booking }) => (
                        <div key={room.id} className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-xs space-y-1">
                          <div className="flex justify-between font-bold text-stone-900">
                            <span>{room.room_name} ({room.room_number})</span>
                            <span className="font-mono text-red-700 text-[11px]">{booking?.booking_code}</span>
                          </div>
                          {booking && (
                            <div className="text-[11px] text-stone-600 space-y-0.5">
                              <div>Tamu: <strong>{booking.guest_name}</strong></div>
                              <div>Jadwal: {booking.check_in_date} s/d {booking.check_out_date}</div>
                              <div>Tamu: {booking.adult_count} Dewasa, {(booking.teen_count || 0) + (booking.child_count || 0)} Anak</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-stone-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    <span>Kamar Kosong ({availableRoomsDetail.length})</span>
                  </span>

                  {availableRoomsDetail.length === 0 ? (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center text-xs text-red-700">
                      Seluruh kabin terisi penuh pada tanggal ini.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {availableRoomsDetail.map((room) => (
                        <div key={room.id} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs flex items-center justify-between">
                          <div>
                            <span className="font-bold text-stone-900 block">{room.room_name} ({room.room_number})</span>
                            <span className="text-[11px] text-stone-500">Maks {room.capacity} Orang</span>
                          </div>
                          <Link href={`/admin/pesanan-penginapan?roomId=${room.id}&date=${lodgingSelectedDate}`}>
                            <button className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                              + Booking
                            </button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Module Launcher Drawer Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsModuleGridOpen(!isModuleGridOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl border border-stone-300 transition-colors shadow-2xs"
        >
          <LayoutGrid className="w-4 h-4 text-amber-600" />
          <span>{isModuleGridOpen ? 'Sembunyikan Pintasan Modul' : 'Tampilkan Pintasan Lengkap 17 Modul Admin'}</span>
          {isModuleGridOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Quick Module Launcher Grid */}
      {isModuleGridOpen && (
        <Card className="border-stone-300 shadow-xs bg-stone-50/60 p-4 animate-in fade-in">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-stone-200 overflow-x-auto text-xs">
            <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] shrink-0">Kategori:</span>
            {(['all', 'operasional', 'inventori', 'master', 'sistem'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveModuleFilter(cat)}
                className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition-colors ${
                  activeModuleFilter === cat ? 'bg-stone-900 text-white' : 'bg-white text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {filteredModules.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group p-3 bg-white hover:bg-stone-900 border border-stone-200/90 hover:border-stone-900 rounded-xl transition-all shadow-2xs hover:shadow-md flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${item.iconBg}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {item.badge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-600">
                        {item.badge}
                      </span>
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
        </Card>
      )}

      {/* Critical Stock & Payments Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader title="Penerimaan Kas Hari Ini" subtitle="Berdasarkan kanal pembayaran aktual hari ini" />
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
              <span className="text-xs font-semibold text-stone-700">Cash / Tunai</span>
              <span className="text-sm font-bold text-stone-900">{formatRupiah(todayCash)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
              <span className="text-xs font-semibold text-stone-700">QRIS</span>
              <span className="text-sm font-bold text-stone-900">{formatRupiah(todayQris)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
              <span className="text-xs font-semibold text-stone-700">Transfer Bank</span>
              <span className="text-sm font-bold text-stone-900">{formatRupiah(todayTransfer)}</span>
            </div>
            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs font-bold text-stone-800">
              <span>Total Kas Diterima:</span>
              <span className="text-sm text-emerald-700">{formatRupiah(todayCash + todayQris + todayTransfer)}</span>
            </div>
          </div>
        </Card>

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

      {/* ================================================================== */}
      {/* MODAL: DETAIL PESANAN                                              */}
      {/* ================================================================== */}
      {selectedDetailOrder && (
        <Modal
          isOpen={!!selectedDetailOrder}
          onClose={() => setSelectedDetailOrder(null)}
          title={`Detail Pesanan: ${selectedDetailOrder.booking_code}`}
          subtitle={`Waktu: ${formatDateTimeWIB(selectedDetailOrder.created_at)}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl space-y-2 border border-stone-200">
              <div className="flex justify-between">
                <span className="text-stone-500">Nama Tamu:</span>
                <span className="font-bold text-stone-900">{selectedDetailOrder.guest_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Telepon / WhatsApp:</span>
                {selectedDetailOrder.guest_phone ? (
                  <a
                    href={generateWhatsAppLink(selectedDetailOrder.guest_phone, `Halo Bapak/Ibu ${selectedDetailOrder.guest_name}, pesanan ${selectedDetailOrder.booking_code}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{selectedDetailOrder.guest_phone}</span>
                  </a>
                ) : (
                  <span>-</span>
                )}
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Tipe Pesanan:</span>
                <span className="font-semibold text-stone-800 uppercase">{selectedDetailOrder.order_type}</span>
              </div>
              {selectedDetailOrder.table_number_snapshot && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Nomor Meja:</span>
                  <span className="font-bold text-amber-800">Meja {selectedDetailOrder.table_number_snapshot}</span>
                </div>
              )}
              {selectedDetailOrder.room_name_snapshot && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Kamar Kabin:</span>
                  <span className="font-bold text-emerald-800">
                    {selectedDetailOrder.room_name_snapshot} ({selectedDetailOrder.check_in_date} s/d {selectedDetailOrder.check_out_date})
                  </span>
                </div>
              )}
            </div>

            {/* Items Breakdown */}
            {selectedDetailOrder.order_items && selectedDetailOrder.order_items.length > 0 && (
              <div className="space-y-2">
                <span className="font-bold text-stone-800 uppercase text-[10px] tracking-wider block">
                  Menu & Rincian Pesanan
                </span>
                <div className="border border-stone-200 rounded-lg overflow-hidden divide-y divide-stone-100">
                  {selectedDetailOrder.order_items.map((it, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-stone-900 block">{it.menu_name_snapshot}</span>
                        {it.total_gram > 0 && (
                          <span className="text-[10px] text-stone-500">{formatGram(it.total_gram)} daging</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-stone-500 mr-3">{it.qty}x</span>
                        <span className="font-bold text-stone-900">{formatRupiah(it.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="p-3 bg-stone-900 text-white rounded-xl space-y-1.5 font-mono">
              <div className="flex justify-between text-xs text-stone-300">
                <span>Total Tagihan:</span>
                <span className="font-bold text-amber-400 text-sm">{formatRupiah(selectedDetailOrder.total_amount)}</span>
              </div>
              <div className="flex justify-between text-xs text-stone-400">
                <span>Sudah Dibayar:</span>
                <span>{formatRupiah(selectedDetailOrder.paid_amount)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 border-t border-stone-800 font-bold">
                <span className={selectedDetailOrder.remaining_amount > 0 ? 'text-red-400' : 'text-emerald-400'}>
                  Sisa Tagihan:
                </span>
                <span className={selectedDetailOrder.remaining_amount > 0 ? 'text-red-400' : 'text-emerald-400'}>
                  {formatRupiah(selectedDetailOrder.remaining_amount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-stone-200">
              <Button variant="outline" size="sm" onClick={() => setSelectedDetailOrder(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
