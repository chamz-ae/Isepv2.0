'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { UtensilsCrossed, Plus, Check, ShoppingBag, Flame, Sparkles } from 'lucide-react';
import { getMenus } from '@/lib/services/menuService';
import { MenuItem } from '@/lib/supabase/types';
import { formatRupiah, formatGram } from '@/lib/utils/formatters';
import { useCustomerOrder } from '@/context/CustomerOrderContext';
import { CustomerFooter } from '@/components/customer/CustomerFooter';
import { Button } from '@/components/ui/Button';

export default function CustomerMenuPage() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'restaurant' | 'lodging'>('restaurant');
  const [gramMap, setGramMap] = useState<Record<string, number>>({});
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [addedAnimation, setAddedAnimation] = useState<string | null>(null);

  const { addMenuItem, cartItems } = useCustomerOrder();

  useEffect(() => {
    async function load() {
      const data = await getMenus({ accessScope: activeTab, activeOnly: true });
      setMenus(data);

      // Initialize default grams (minimum 100g for variable meat items)
      const initialGrams: Record<string, number> = {};
      const initialQtys: Record<string, number> = {};
      data.forEach((m) => {
        initialGrams[m.id] = m.is_fixed_gram ? m.standard_meat_gram : Math.max(100, m.standard_meat_gram || 100);
        initialQtys[m.id] = 1;
      });
      setGramMap(initialGrams);
      setQtyMap(initialQtys);
    }
    load();
  }, [activeTab]);

  const handleAdd = (menu: MenuItem) => {
    const isMeat = menu.meat_type !== 'none';
    const isPerEkor = menu.price_basis === 'per_ekor';
    const isFixedPortionMeat = isMeat && (menu.is_fixed_gram || (menu.price_basis === 'per_portion' && menu.standard_meat_gram > 0 && menu.standard_meat_gram <= 50));
    const isScalePer100g = (menu.price_basis === 'per_100g' || menu.price_basis === 'per_gram') || (isMeat && !isPerEkor && !isFixedPortionMeat && menu.price_basis !== 'per_portion');

    const gram = isScalePer100g
      ? Math.max(100, gramMap[menu.id] || menu.standard_meat_gram || 100)
      : menu.is_fixed_gram
      ? menu.standard_meat_gram
      : 0;

    const qty = qtyMap[menu.id] || 1;

    addMenuItem(menu, gram, qty);
    setAddedAnimation(menu.id);
    setTimeout(() => setAddedAnimation(null), 1500);
  };

  const totalCartCount = cartItems.reduce((acc, it) => acc + it.qty, 0);

  return (
    <div className="min-h-screen bg-forest-950 text-stone-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white">
      <div className="max-w-7xl mx-auto px-6 py-12 w-full">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <span className="text-[11px] font-mono uppercase tracking-[0.25em] text-emerald-400 font-bold">
            KULINER ASAP KAYU RAMBUTAN FOOD FOREST
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-light text-stone-50">
            Katalog Menu Daging & Hidangan
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-light leading-relaxed">
            Pilihan menu daging dengan klasifikasi tarif transparan: per 100gr (fleksibel min 100g), 1 ekor utuh (unggas), dan per porsi hidangan. Seluruh pesanan langsung terhubung dan tersinkron ke dashboard sistem.
          </p>

          {/* Scope Tab Switcher */}
          <div className="inline-flex items-center p-1.5 bg-forest-900/80 border border-forest-800/80 rounded-full mt-4 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('restaurant')}
              className={`px-6 py-2 text-xs font-mono font-bold rounded-full transition-all ${
                activeTab === 'restaurant'
                  ? 'bg-emerald-600 text-forest-950 shadow-md font-bold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Menu Restoran
            </button>
            <button
              onClick={() => setActiveTab('lodging')}
              className={`px-6 py-2 text-xs font-mono font-bold rounded-full transition-all ${
                activeTab === 'lodging'
                  ? 'bg-emerald-600 text-forest-950 shadow-md font-bold'
                  : 'text-stone-300 hover:text-white'
              }`}
            >
              Spesial Tamu Kabin Inap
            </button>
          </div>
        </div>

        {/* Floating Cart Indicator */}
        {totalCartCount > 0 && (
          <div className="sticky top-24 z-30 mb-8 flex justify-end">
            <Link
              href="/pesanan"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-forest-950 font-bold text-xs font-mono rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-black/80"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{totalCartCount} Porsi di Keranjang • Lanjut ke Pemesanan</span>
            </Link>
          </div>
        )}

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menus.map((menu) => {
            const isMeat = menu.meat_type !== 'none';
            const isPerEkor = menu.price_basis === 'per_ekor';
            const isFixedPortionMeat = isMeat && (menu.is_fixed_gram || (menu.price_basis === 'per_portion' && menu.standard_meat_gram > 0 && menu.standard_meat_gram <= 50));
            // Per 100gr is any meat item with price_basis === 'per_100g' or 'per_gram', OR any meat item that is neither per_ekor nor fixed portion
            const isScalePer100g = (menu.price_basis === 'per_100g' || menu.price_basis === 'per_gram') || (isMeat && !isPerEkor && !isFixedPortionMeat && menu.price_basis !== 'per_portion');

            const currentGram = gramMap[menu.id] || (menu.is_fixed_gram ? menu.standard_meat_gram : 100);
            const currentQty = qtyMap[menu.id] || 1;

            // Dynamic Price Calculation
            let calculatedItemPrice = menu.price;
            if (isScalePer100g) {
              calculatedItemPrice = Math.round((menu.price * currentGram) / 100);
            }

            const isJustAdded = addedAnimation === menu.id;

            return (
              <div
                key={menu.id}
                className="bg-forest-900/40 border border-forest-800/70 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-emerald-600/40 shadow-xl backdrop-blur-md"
              >
                <div>
                  {menu.image_url && (
                    <div className="relative w-full h-52 bg-forest-950">
                      <Image src={menu.image_url} alt={menu.name} fill className="object-cover" />
                      <div className="absolute top-3 right-3 flex items-center gap-1.5">
                        {isMeat && (
                          <span className="text-[10px] bg-forest-950/90 text-emerald-300 border border-emerald-600/40 px-2.5 py-1 rounded-full font-mono font-bold uppercase tracking-wider">
                            🥩 {menu.meat_type.replace('_', ' ')} • {isPerEkor ? '1 Ekor' : isScalePer100g ? 'Per 100g' : 'Per Porsi'}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="font-serif text-2xl font-light text-stone-100">{menu.name}</h3>
                    <p className="text-xs text-stone-300/80 mt-2 leading-relaxed font-light">{menu.description}</p>

                    {/* 1. Daging Gramasi Fleksibel (Per 100gr) */}
                    {isScalePer100g && (
                      <div className="mt-5 p-4 bg-forest-950/80 rounded-2xl border border-forest-800/60 space-y-3 font-mono">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                            Pilihan Gramasi Daging:
                          </span>
                          <span className="font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-600/40 px-2 py-0.5 rounded-lg">
                            {currentGram} Gram
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {/* Preset Weight Buttons with dynamic prices */}
                          <div className="grid grid-cols-3 gap-1.5">
                            {[100, 150, 200, 250, 300, 500].map((g) => {
                              const presetPrice = Math.round((menu.price * g) / 100);
                              const isSelected = currentGram === g;
                              return (
                                <button
                                  key={g}
                                  type="button"
                                  onClick={() => setGramMap((prev) => ({ ...prev, [menu.id]: g }))}
                                  className={`py-2 px-1 text-[11px] rounded-xl font-mono font-bold transition-all flex flex-col items-center justify-center ${
                                    isSelected
                                      ? 'bg-emerald-600 text-forest-950 shadow-md scale-[1.02]'
                                      : 'bg-forest-900 text-stone-300 border border-forest-800 hover:text-white hover:border-emerald-700/60'
                                  }`}
                                >
                                  <span>{g}g</span>
                                  <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-forest-950 font-extrabold' : 'text-emerald-400/90'}`}>
                                    {formatRupiah(presetPrice)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Stepper for custom gramasi (min 100g, step 50g) */}
                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-forest-800/40 text-stone-300">
                            <span className="text-[10px] text-stone-400">Atur berat bebas (min 100g):</span>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  setGramMap((prev) => ({
                                    ...prev,
                                    [menu.id]: Math.max(100, (prev[menu.id] || 100) - 50),
                                  }))
                                }
                                className="w-7 h-7 rounded-lg bg-forest-900 border border-forest-800 hover:bg-forest-800 flex items-center justify-center font-bold text-xs"
                              >
                                -
                              </button>
                              <span className="font-bold text-emerald-300 min-w-12 text-center">{currentGram}g</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setGramMap((prev) => ({
                                    ...prev,
                                    [menu.id]: (prev[menu.id] || 100) + 50,
                                  }))
                                }
                                className="w-7 h-7 rounded-lg bg-forest-900 border border-forest-800 hover:bg-forest-800 flex items-center justify-center font-bold text-xs"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="text-[10px] text-emerald-400/80 text-right pt-0.5">
                            Tarif Dasar: {formatRupiah(menu.price)} / 100gr
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. Daging Per Ekor (Unggas Utuh) */}
                    {isPerEkor && (
                      <div className="mt-5 p-4 bg-forest-950/80 rounded-2xl border border-forest-800/60 space-y-2 font-mono">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span>
                            Satuan Penjualan:
                          </span>
                          <span className="font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-600/30 px-2 py-0.5 rounded-lg text-[11px]">
                            1 Ekor Utuh
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
                          Disajikan 1 ekor utuh olahan asap kayu rambutan tradisional siap santap.
                        </p>
                        <div className="text-[10px] text-emerald-400/80 text-right pt-1 border-t border-forest-800/40">
                          Tarif: {formatRupiah(menu.price)} / 1 ekor
                        </div>
                      </div>
                    )}

                    {/* 3. Daging Porsi Tetap (Fixed Gram Portioned) */}
                    {isFixedPortionMeat && (
                      <div className="mt-5 p-4 bg-forest-950/80 rounded-2xl border border-forest-800/60 space-y-2 font-mono">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-stone-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                            Porsi Tetap Daging Asap:
                          </span>
                          <span className="font-bold text-amber-300 bg-amber-950/80 border border-amber-600/30 px-2 py-0.5 rounded-lg text-[11px]">
                            Fixed {menu.standard_meat_gram || 30}g Daging
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
                          Takaran daging asap wajan besi pas dan konsisten terpadu dalam 1 porsi hidangan.
                        </p>
                        <div className="text-[10px] text-stone-400 text-right pt-1 border-t border-forest-800/40">
                          Tarif: {formatRupiah(menu.price)} / porsi
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action & Price */}
                <div className="p-6 pt-0">
                  <div className="pt-4 border-t border-forest-800/50 flex items-center justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block">
                        {isPerEkor
                          ? `Harga (1 Ekor${currentQty > 1 ? ` × ${currentQty}` : ''})`
                          : isScalePer100g
                          ? `Total (${currentGram}g${currentQty > 1 ? ` × ${currentQty}` : ''})`
                          : `Harga (${currentQty > 1 ? `${currentQty} Porsi` : 'per Porsi'})`}
                      </span>
                      <span className="text-xl font-black text-emerald-400 font-mono">
                        {menu.price_range_min && menu.price_range_max
                          ? `${formatRupiah(menu.price_range_min * currentQty)} – ${formatRupiah(menu.price_range_max * currentQty)}`
                          : formatRupiah(calculatedItemPrice * currentQty)}
                      </span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-2 bg-forest-950 border border-forest-800 rounded-xl p-1 font-mono">
                      <button
                        type="button"
                        onClick={() =>
                          setQtyMap((prev) => ({
                            ...prev,
                            [menu.id]: Math.max(1, (prev[menu.id] || 1) - 1),
                          }))
                        }
                        className="w-7 h-7 rounded-lg bg-forest-900 hover:bg-forest-800 flex items-center justify-center text-xs font-bold text-stone-300"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-stone-100">
                        {currentQty}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setQtyMap((prev) => ({
                            ...prev,
                            [menu.id]: (prev[menu.id] || 1) + 1,
                          }))
                        }
                        className="w-7 h-7 rounded-lg bg-forest-900 hover:bg-forest-800 flex items-center justify-center text-xs font-bold text-stone-300"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleAdd(menu)}
                    disabled={!menu.is_available}
                    className={`w-full py-3 text-xs uppercase tracking-wider font-mono font-bold rounded-2xl transition-all ${
                      isJustAdded
                        ? 'bg-emerald-500 text-forest-950'
                        : menu.is_available
                        ? 'bg-gradient-to-r from-forest-800 to-forest-700 hover:from-forest-700 hover:to-forest-600 text-emerald-200 border border-emerald-600/40 hover:border-emerald-500'
                        : 'bg-stone-900 text-stone-500 cursor-not-allowed border border-stone-800'
                    }`}
                  >
                    {isJustAdded ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4 text-forest-950" />
                        <span>Ditambahkan ke Pesanan</span>
                      </span>
                    ) : menu.is_available ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Plus className="w-4 h-4 text-emerald-400" />
                        <span>Tambah ke Pesanan ({formatRupiah(calculatedItemPrice * currentQty)})</span>
                      </span>
                    ) : (
                      <span>Habis (Sold Out)</span>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CustomerFooter />
    </div>
  );
}
