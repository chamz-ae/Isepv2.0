'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Plus,
  Check,
  ShoppingBag,
  Flame,
  Search,
  ArrowRight,
} from 'lucide-react';
import { getMenus } from '@/lib/services/menuService';
import { MenuItem } from '@/lib/supabase/types';
import { formatRupiah, formatGram } from '@/lib/utils/formatters';
import { useCustomerOrder } from '@/context/CustomerOrderContext';
import { CustomerFooter } from '@/components/customer/CustomerFooter';

// ─── Gram presets for the selector ───────────────────────────────────────────
const GRAM_PRESETS = [100, 150, 200, 300, 500] as const;

// ─── Meat type display map ────────────────────────────────────────────────────
const MEAT_LABEL: Record<string, string> = {
  brisket: 'Brisket Sapi',
  ayam: 'Ayam Kampung',
  domba: 'Domba Gunung',
  marlin: 'Marlin Asap',
  lele: 'Lele Jumbo',
  salmon: 'Salmon Pilihan',
  bebek: 'Bebek Peking',
  lidah_sapi: 'Lidah Sapi',
  none: '',
};

// ─── Pricing logic helpers ────────────────────────────────────────────────────
function isScaledByGram(menu: MenuItem): boolean {
  return (
    menu.price_basis === 'per_100g' ||
    menu.price_basis === 'per_gram' ||
    (menu.meat_type !== 'none' &&
      menu.price_basis !== 'per_ekor' &&
      !(
        menu.is_fixed_gram ||
        (menu.price_basis === 'per_portion' &&
          menu.standard_meat_gram > 0 &&
          menu.standard_meat_gram <= 50)
      ) &&
      menu.price_basis !== 'per_portion')
  );
}

function isPerEkor(menu: MenuItem): boolean {
  return menu.price_basis === 'per_ekor';
}

function isFixedPortionMeat(menu: MenuItem): boolean {
  const isMeat = menu.meat_type !== 'none';
  return (
    isMeat &&
    (menu.is_fixed_gram ||
      (menu.price_basis === 'per_portion' &&
        menu.standard_meat_gram > 0 &&
        menu.standard_meat_gram <= 50))
  );
}

function calcItemPrice(menu: MenuItem, gram: number): number {
  if (isScaledByGram(menu)) {
    return Math.round((menu.price * gram) / 100);
  }
  return menu.price;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Compact gram preset pills with gold selected state */
function GramSelector({
  menuId,
  currentGram,
  price,
  onChange,
}: {
  menuId: string;
  currentGram: number;
  price: number;
  onChange: (g: number) => void;
}) {
  return (
    <div className="mt-5 space-y-3">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-[0.18em] text-[#b8ad9e]/70"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          Pilihan Gramasi
        </span>
        <span
          className="text-[11px] text-[#c9a96e]"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          {currentGram}g · {formatRupiah(Math.round((price * currentGram) / 100))}
        </span>
      </div>

      {/* Preset pill grid */}
      <div className="flex flex-wrap gap-1.5">
        {GRAM_PRESETS.map((g) => {
          const selected = currentGram === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => onChange(g)}
              className={`px-3 py-1.5 text-[10px] rounded-sm transition-all duration-200 border ${
                selected
                  ? 'bg-[#c9a96e] border-[#c9a96e] text-stone-950 font-semibold'
                  : 'bg-transparent border-[#c9a96e]/20 text-[#b8ad9e] hover:border-[#c9a96e]/50 hover:text-[#c9a96e]'
              }`}
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {g}g
            </button>
          );
        })}
      </div>

      {/* Custom stepper */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span
          className="text-[10px] text-[#b8ad9e]/50"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          Kustom (step 50g)
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(Math.max(100, currentGram - 50))}
            className="w-6 h-6 flex items-center justify-center border border-white/10 text-[#b8ad9e] hover:border-[#c9a96e]/40 hover:text-[#c9a96e] transition-colors text-xs rounded-[2px]"
          >
            −
          </button>
          <span
            className="text-[11px] text-[#c9a96e] min-w-[3rem] text-center"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {currentGram}g
          </span>
          <button
            type="button"
            onClick={() => onChange(currentGram + 50)}
            className="w-6 h-6 flex items-center justify-center border border-white/10 text-[#b8ad9e] hover:border-[#c9a96e]/40 hover:text-[#c9a96e] transition-colors text-xs rounded-[2px]"
          >
            +
          </button>
        </div>
      </div>

      <div
        className="text-right text-[10px] text-[#b8ad9e]/40"
        style={{ fontFamily: 'DM Mono, monospace' }}
      >
        {formatRupiah(price)} / 100g
      </div>
    </div>
  );
}

/** Qty stepper used for per-ekor and fixed-portion items */
function QtyRow({
  qty,
  onDec,
  onInc,
}: {
  qty: number;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mt-5 pt-4 border-t border-white/5">
      <span
        className="text-[10px] text-[#b8ad9e]/60 uppercase tracking-widest flex-1"
        style={{ fontFamily: 'DM Mono, monospace' }}
      >
        Jumlah
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDec}
          className="w-7 h-7 flex items-center justify-center border border-white/10 text-[#b8ad9e] hover:border-[#c9a96e]/50 hover:text-[#c9a96e] transition-colors text-sm rounded-[2px]"
        >
          −
        </button>
        <span
          className="text-sm text-stone-100 min-w-[1.5rem] text-center"
          style={{ fontFamily: 'DM Mono, monospace' }}
        >
          {qty}
        </span>
        <button
          type="button"
          onClick={onInc}
          className="w-7 h-7 flex items-center justify-center border border-white/10 text-[#b8ad9e] hover:border-[#c9a96e]/50 hover:text-[#c9a96e] transition-colors text-sm rounded-[2px]"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ─── Main Card ────────────────────────────────────────────────────────────────
function MenuCard({
  menu,
  gram,
  qty,
  isAdded,
  onGramChange,
  onQtyChange,
  onAdd,
}: {
  menu: MenuItem;
  gram: number;
  qty: number;
  isAdded: boolean;
  onGramChange: (g: number) => void;
  onQtyChange: (q: number) => void;
  onAdd: () => void;
}) {
  const scaled = isScaledByGram(menu);
  const ekor = isPerEkor(menu);
  const fixedPortion = isFixedPortionMeat(menu);
  const isMeat = menu.meat_type !== 'none';
  const calculatedPrice = calcItemPrice(menu, gram);
  const totalPrice = calculatedPrice * qty;

  const basisLabel = ekor
    ? '1 Ekor'
    : scaled
    ? 'Per 100g'
    : fixedPortion
    ? `${menu.standard_meat_gram || 30}g Fix`
    : 'Per Porsi';

  return (
    <article className="group relative flex flex-col bg-[#1a1713]/80 border border-white/[0.06] overflow-hidden transition-all duration-500 hover:border-[#c9a96e]/20 hover:shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      {/* ── Image ── */}
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-stone-900">
        {menu.image_url ? (
          <Image
            src={menu.image_url}
            alt={menu.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Flame className="w-10 h-10 text-[#c9a96e]/20" />
          </div>
        )}
        {/* Dark gradient scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1713] via-[#1a1713]/10 to-transparent" />

        {/* Meat type badge */}
        {isMeat && (
          <div className="absolute top-3 left-3">
            <span
              className="px-2 py-1 text-[9px] uppercase tracking-[0.15em] text-[#c9a96e] border border-[#c9a96e]/25 bg-[#1a1713]/80 backdrop-blur-sm"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {MEAT_LABEL[menu.meat_type] ?? menu.meat_type} · {basisLabel}
            </span>
          </div>
        )}

        {/* Unavailable overlay */}
        {!menu.is_available && (
          <div className="absolute inset-0 bg-[#1a1713]/70 flex items-center justify-center">
            <span
              className="text-[10px] uppercase tracking-[0.2em] text-[#b8ad9e]/50 border border-[#b8ad9e]/20 px-3 py-1"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-col flex-1 p-5">
        {/* Dish name */}
        <h3
          className="text-xl font-medium italic text-stone-100 leading-tight"
          style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
        >
          {menu.name}
        </h3>

        {/* Description */}
        {menu.description && (
          <p
            className="mt-2 text-[12px] leading-relaxed text-[#b8ad9e] font-light"
            style={{ fontFamily: 'DM Sans, sans-serif' }}
          >
            {menu.description}
          </p>
        )}

        {/* Base price line */}
        <div className="mt-3 flex items-baseline gap-2">
          <span
            className="text-[11px] text-[#b8ad9e]/50 uppercase tracking-widest"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            Mulai
          </span>
          <span
            className="text-base text-[#c9a96e]"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {formatRupiah(menu.price)}
          </span>
          <span
            className="text-[10px] text-[#b8ad9e]/40"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            / {ekor ? 'ekor' : scaled ? '100g' : 'porsi'}
          </span>
        </div>

        {/* ── Selectors ── */}
        {scaled && (
          <GramSelector
            menuId={menu.id}
            currentGram={gram}
            price={menu.price}
            onChange={onGramChange}
          />
        )}

        {(ekor || fixedPortion) && (
          <QtyRow
            qty={qty}
            onDec={() => onQtyChange(Math.max(1, qty - 1))}
            onInc={() => onQtyChange(qty + 1)}
          />
        )}

        {/* Fixed portion note */}
        {fixedPortion && (
          <p
            className="mt-2 text-[10px] text-[#b8ad9e]/40"
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            Porsi tetap {menu.standard_meat_gram || 30}g daging asap
          </p>
        )}

        {/* ── Price + Add Row ── */}
        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <span
                className="block text-[9px] uppercase tracking-[0.2em] text-[#b8ad9e]/40 mb-0.5"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {scaled
                  ? `Total ${gram}g${qty > 1 ? ` × ${qty}` : ''}`
                  : qty > 1
                  ? `${qty} Porsi`
                  : 'Total'}
              </span>
              <span
                className="text-lg text-[#c9a96e]"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {menu.price_range_min && menu.price_range_max
                  ? `${formatRupiah(menu.price_range_min)} – ${formatRupiah(menu.price_range_max)}`
                  : formatRupiah(totalPrice)}
              </span>
            </div>

            {/* Qty stepper for scalable gram items */}
            {scaled && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onQtyChange(Math.max(1, qty - 1))}
                  className="w-7 h-7 flex items-center justify-center border border-white/8 text-[#b8ad9e] hover:border-[#c9a96e]/40 hover:text-[#c9a96e] transition-colors text-sm rounded-[2px]"
                >
                  −
                </button>
                <span
                  className="text-sm text-stone-100 min-w-[1.5rem] text-center"
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => onQtyChange(qty + 1)}
                  className="w-7 h-7 flex items-center justify-center border border-white/8 text-[#b8ad9e] hover:border-[#c9a96e]/40 hover:text-[#c9a96e] transition-colors text-sm rounded-[2px]"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Add button */}
          <button
            type="button"
            onClick={onAdd}
            disabled={!menu.is_available}
            className={`w-full py-3 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.18em] transition-all duration-300 border ${
              isAdded
                ? 'bg-[#c9a96e] border-[#c9a96e] text-stone-950'
                : menu.is_available
                ? 'bg-transparent border-[#c9a96e]/30 text-[#c9a96e] hover:bg-[#c9a96e]/8 hover:border-[#c9a96e]/60'
                : 'bg-transparent border-white/5 text-[#b8ad9e]/25 cursor-not-allowed'
            }`}
            style={{ fontFamily: 'DM Mono, monospace' }}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Ditambahkan</span>
              </>
            ) : menu.is_available ? (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Pesanan</span>
              </>
            ) : (
              <span>Habis</span>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CustomerMenuPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'restaurant' | 'lodging'>('restaurant');
  const [gramMap, setGramMap] = useState<Record<string, number>>({});
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [addedAnimation, setAddedAnimation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { addMenuItem, cartItems } = useCustomerOrder();

  // Load menus on tab change
  useEffect(() => {
    async function load() {
      setIsLoading(true);
      const data = await getMenus({ accessScope: activeTab, activeOnly: true });
      setMenus(data);

      const initialGrams: Record<string, number> = {};
      const initialQtys: Record<string, number> = {};
      data.forEach((m) => {
        initialGrams[m.id] = m.is_fixed_gram
          ? m.standard_meat_gram
          : Math.max(100, m.standard_meat_gram || 100);
        initialQtys[m.id] = 1;
      });
      setGramMap(initialGrams);
      setQtyMap(initialQtys);
      setIsLoading(false);
    }
    load();
  }, [activeTab]);

  const handleAdd = (menu: MenuItem) => {
    const scaled = isScaledByGram(menu);
    const ekor = isPerEkor(menu);
    const fixedPortion = isFixedPortionMeat(menu);

    const gram = scaled
      ? Math.max(100, gramMap[menu.id] || menu.standard_meat_gram || 100)
      : fixedPortion
      ? menu.standard_meat_gram
      : ekor
      ? 0
      : 0;

    const qty = qtyMap[menu.id] || 1;
    addMenuItem(menu, gram, qty);
    setAddedAnimation(menu.id);
    setTimeout(() => setAddedAnimation(null), 1500);
  };

  // Filtered menus
  const filteredMenus = menus.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.description && m.description.toLowerCase().includes(q))
    );
  });

  const totalCartCount = cartItems.reduce((acc, it) => acc + it.qty, 0);
  const totalCartAmount = cartItems.reduce((acc, it) => acc + it.subtotal, 0);

  return (
    <div className="min-h-screen bg-[#110f0d] text-stone-100 flex flex-col selection:bg-[#c9a96e]/30 selection:text-[#c9a96e]">
      {/* ════════════════════════════════════════════════════════════
          PAGE HEADER — Editorial
      ════════════════════════════════════════════════════════════ */}
      <header className="relative border-b border-white/[0.04] overflow-hidden">
        {/* Subtle texture noise layer */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'200\' height=\'200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
          }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24">
          {/* Editorial section label */}
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-[#c9a96e]/40" />
            <span
              className="text-[10px] uppercase tracking-[0.3em] text-[#c9a96e]/60"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Kulinari · Asap Kayu Rambutan · Cisarua Puncak
            </span>
          </div>

          <div className="max-w-3xl">
            <h1
              className="text-4xl sm:text-6xl lg:text-7xl font-light italic text-stone-50 leading-[1.05] tracking-tight"
              style={{ fontFamily: 'Cormorant Garamond, Georgia, serif' }}
            >
              Katalog
              <br />
              <span className="text-[#c9a96e]">Menu &amp; Daging</span>
            </h1>
            <p
              className="mt-6 text-sm text-[#b8ad9e] font-light leading-relaxed max-w-xl"
              style={{ fontFamily: 'DM Sans, sans-serif' }}
            >
              Pilihan daging asap premium dengan sistem gramasi terbuka, olahan kayu rambutan
              tradisional dari hutan pangan Cisarua. Setiap pesanan tersinkron langsung ke dapur &amp;
              kasir.
            </p>
          </div>

          {/* ── Tab Switcher + Search ── */}
          <div className="mt-10 flex flex-col sm:flex-row sm:items-end gap-6">
            {/* Underline tab switcher */}
            <div className="flex items-end gap-8 border-b border-white/[0.06] pb-0">
              {(
                [
                  { key: 'restaurant', label: 'Restoran' },
                  { key: 'lodging', label: 'Penginapan' },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`pb-3 text-sm transition-all duration-300 relative ${
                    activeTab === key
                      ? 'text-stone-100'
                      : 'text-[#b8ad9e]/40 hover:text-[#b8ad9e]'
                  }`}
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  {label}
                  {/* Gold underline indicator */}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-[1.5px] bg-[#c9a96e] transition-all duration-300 ${
                      activeTab === key ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#b8ad9e]/30 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="cari menu..."
                className="w-full pl-6 pr-0 pb-3 pt-1 bg-transparent border-b border-white/[0.06] focus:border-[#c9a96e]/40 text-[11px] text-stone-100 placeholder-[#b8ad9e]/25 focus:outline-none transition-colors"
                style={{ fontFamily: 'DM Mono, monospace' }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════
          MENU GRID
      ════════════════════════════════════════════════════════════ */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 py-14">
        {isLoading ? (
          /* Loading skeletons */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[#110f0d] p-5 space-y-4 animate-pulse">
                <div className="aspect-[3/4] bg-white/[0.04] rounded-sm" />
                <div className="h-5 bg-white/[0.04] rounded-sm w-3/4" />
                <div className="h-3 bg-white/[0.04] rounded-sm w-full" />
                <div className="h-3 bg-white/[0.04] rounded-sm w-2/3" />
              </div>
            ))}
          </div>
        ) : filteredMenus.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <UtensilsCrossed className="w-8 h-8 text-[#c9a96e]/20" />
            <p
              className="text-[11px] uppercase tracking-[0.2em] text-[#b8ad9e]/30"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              {searchQuery ? 'Tidak ditemukan' : 'Belum ada menu tersedia'}
            </p>
          </div>
        ) : (
          /* Grid — 1col mobile / 2col tablet / 3col desktop */
          /* Gap-px + bg grid line trick for editorial look */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/[0.04]">
            {filteredMenus.map((menu) => {
              const gram = gramMap[menu.id] ?? 100;
              const qty = qtyMap[menu.id] ?? 1;
              return (
                <div key={menu.id} className="bg-[#110f0d]">
                  <MenuCard
                    menu={menu}
                    gram={gram}
                    qty={qty}
                    isAdded={addedAnimation === menu.id}
                    onGramChange={(g) =>
                      setGramMap((prev) => ({ ...prev, [menu.id]: g }))
                    }
                    onQtyChange={(q) =>
                      setQtyMap((prev) => ({ ...prev, [menu.id]: q }))
                    }
                    onAdd={() => handleAdd(menu)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ════════════════════════════════════════════════════════════
          FLOATING CART BANNER — sticky bottom
      ════════════════════════════════════════════════════════════ */}
      {totalCartCount > 0 && (
        <div className="sticky bottom-0 z-50 border-t border-white/[0.06] bg-[#0e0c0a]/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-4 flex items-center justify-between gap-4">
            {/* Left: icon + count + amount */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-5 h-5 text-[#c9a96e]/60" />
                <span
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 flex items-center justify-center rounded-full bg-[#c9a96e] text-stone-950 text-[8px] font-bold"
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  {totalCartCount}
                </span>
              </div>
              <div>
                <span
                  className="text-[9px] uppercase tracking-[0.2em] text-[#b8ad9e]/40 block"
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  {totalCartCount} item di keranjang
                </span>
                <span
                  className="text-base text-[#c9a96e]"
                  style={{ fontFamily: 'DM Mono, monospace' }}
                >
                  {formatRupiah(totalCartAmount)}
                </span>
              </div>
            </div>

            {/* Right: CTA */}
            <Link
              href="/pesanan"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#c9a96e] hover:bg-[#d4b87d] text-stone-950 transition-colors"
            >
              <span
                className="text-[10px] uppercase tracking-[0.18em] font-semibold"
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                Lihat Pesanan
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════════ */}
      <CustomerFooter />
    </div>
  );
}
