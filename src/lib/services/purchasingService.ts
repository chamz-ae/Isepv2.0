import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Supplier, Purchase, PurchaseItem, StockMovement, PaymentMethod } from '@/lib/supabase/types';
import { generatePurchaseNumber } from '@/lib/utils/formatters';
import { getInventoryItems } from './inventoryService';

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 's001',
    supplier_name: 'PT Nusantara Prime Meat',
    contact_person: 'Pak Hendra Gunawan',
    phone: '081234567890',
    address: 'Kawasan Industri Ruminansia Blok C-4, Jakarta Barat',
    notes: 'Pemasok utama USDA Prime Whole Packer Brisket bersertifikat Halal',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's002',
    supplier_name: 'CV Kayu Rambutan SmokeWood',
    contact_person: 'Kang Deden',
    phone: '081987654321',
    address: 'Sentra Perkebunan Buah Cisarua, Bogor',
    notes: 'Spesialis kayu rambutan dan apel kering kadar air < 18%',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's003',
    supplier_name: 'Peternakan Ayam Kampung Pasir Muncang',
    contact_person: 'Pak Ujang',
    phone: '085712349999',
    address: 'Megamendung, Bogor',
    notes: 'Pemasok ayam kampung segar harian untuk ungkep penginapan',
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 's004',
    supplier_name: 'Pasar Tradisional Ciawi',
    contact_person: 'Ibu Ningsih (Sayur & Bumbu)',
    phone: '081398761234',
    address: 'Pasar Ciawi Blok B No. 12, Bogor',
    notes: 'Pemasok rempah-rempah segar, cabai, bawang, sayuran pendamping',
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

export const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'po_init_001',
    purchase_number: 'PO-202610-001',
    supplier_id: 's001',
    supplier_name_snapshot: 'PT Nusantara Prime Meat',
    purchase_date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
    category: 'restaurant',
    invoice_number: 'NPM-88219',
    total_amount: 2700000,
    payment_method: 'bank_transfer',
    operator_name: 'Pak Hendra Gunawan',
    notes: 'USDA Prime Brisket Segar untuk stok akhir pekan',
    is_inventory_integrated: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    purchase_items: [
      {
        id: 'poi_init_001',
        purchase_id: 'po_init_001',
        inventory_id: 'inv_raw_01',
        item_name_snapshot: 'USDA Prime Brisket (Raw)',
        category: 'restaurant',
        invoice_weight_kg: 15,
        received_weight_kg: 15,
        received_weight_gram: 15000,
        unit_price_per_kg: 180000,
        subtotal: 2700000,
        is_stock_item: true,
        unit_type: 'daging',
        quantity: 15,
        notes: '15.0 Kg Daging Segar',
      },
    ],
  },
  {
    id: 'po_init_002',
    purchase_number: 'PO-202610-002',
    supplier_id: 's003',
    supplier_name_snapshot: 'Peternakan Ayam Kampung Pasir Muncang',
    purchase_date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    category: 'restaurant',
    invoice_number: 'AK-4412',
    total_amount: 900000,
    payment_method: 'cash',
    operator_name: 'Kang Ujang (Kitchen)',
    notes: 'Ayam kampung untuk menu ayam asap bumbu rempah',
    is_inventory_integrated: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    purchase_items: [
      {
        id: 'poi_init_002',
        purchase_id: 'po_init_002',
        inventory_id: 'inv_raw_02',
        item_name_snapshot: 'Ayam Kampung Segar',
        category: 'restaurant',
        invoice_weight_kg: 20,
        received_weight_kg: 20,
        received_weight_gram: 20000,
        unit_price_per_kg: 45000,
        subtotal: 900000,
        is_stock_item: true,
        unit_type: 'ekor',
        quantity: 20,
        notes: '20 Ekor ayam utuh',
      },
    ],
  },
  {
    id: 'po_init_003',
    purchase_number: 'PO-202610-003',
    supplier_id: 's002',
    supplier_name_snapshot: 'CV Kayu Rambutan SmokeWood',
    purchase_date: new Date().toISOString().slice(0, 10),
    category: 'restaurant',
    invoice_number: 'KW-1092',
    total_amount: 500000,
    payment_method: 'cash',
    operator_name: 'Dedi (Smoker Crew)',
    notes: 'Kayu bakar rambutan kering untuk pengasapan 14 jam',
    is_inventory_integrated: false,
    created_at: new Date().toISOString(),
    purchase_items: [
      {
        id: 'poi_init_003',
        purchase_id: 'po_init_003',
        inventory_id: null,
        item_name_snapshot: 'Kayu Rambutan SmokeWood (Karung)',
        category: 'operational',
        invoice_weight_kg: 0,
        received_weight_kg: 0,
        received_weight_gram: 0,
        unit_price_per_kg: 50000,
        subtotal: 500000,
        is_stock_item: false,
        unit_type: 'pcs',
        quantity: 10,
        notes: '10 Karung kayu rambutan',
      },
    ],
  },
];

function isValidUUID(id?: string | null): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

export async function getSuppliers(): Promise<Supplier[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('suppliers').select('*').order('supplier_name', { ascending: true });
      if (!error && data && data.length > 0) return data as Supplier[];
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_suppliers_store');
    if (stored) return JSON.parse(stored);
    localStorage.setItem('asap_suppliers_store', JSON.stringify(INITIAL_SUPPLIERS));
  }

  return INITIAL_SUPPLIERS;
}

export async function saveSupplier(supplier: Partial<Supplier>): Promise<Supplier> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      if (supplier.id && isValidUUID(supplier.id)) {
        const { data } = await supabase.from('suppliers').update(supplier).eq('id', supplier.id).select().single();
        if (data) return data as Supplier;
      } else {
        const { data } = await supabase.from('suppliers').insert({
          supplier_name: supplier.supplier_name,
          contact_person: supplier.contact_person,
          phone: supplier.phone,
          address: supplier.address,
          notes: supplier.notes,
          is_active: supplier.is_active ?? true,
        }).select().single();
        if (data) return data as Supplier;
      }
    } catch (err) {
      console.warn('Supabase saveSupplier fallback to local storage:', err);
    }
  }

  const all = await getSuppliers();
  let saved: Supplier;
  if (supplier.id) {
    saved = { ...all.find((s) => s.id === supplier.id)!, ...supplier } as Supplier;
    const updated = all.map((s) => (s.id === supplier.id ? saved : s));
    if (typeof window !== 'undefined') localStorage.setItem('asap_suppliers_store', JSON.stringify(updated));
  } else {
    saved = {
      ...supplier,
      id: 's_' + Date.now(),
      supplier_name: supplier.supplier_name || 'Supplier Baru',
      phone: supplier.phone || '',
      is_active: true,
      created_at: new Date().toISOString(),
    } as Supplier;
    const updated = [...all, saved];
    if (typeof window !== 'undefined') localStorage.setItem('asap_suppliers_store', JSON.stringify(updated));
  }

  return saved;
}

export async function getPurchases(): Promise<Purchase[]> {
  let localData: Purchase[] = [];
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('asap_purchases_store');
      if (stored) {
        localData = JSON.parse(stored);
      } else {
        localData = INITIAL_PURCHASES;
        localStorage.setItem('asap_purchases_store', JSON.stringify(INITIAL_PURCHASES));
      }
    } catch {
      localData = INITIAL_PURCHASES;
    }
  } else {
    localData = INITIAL_PURCHASES;
  }

  const configured = isSupabaseConfigured();
  if (configured) {
    try {
      const supabase = createClient();
      let { data, error } = await supabase
        .from('purchases')
        .select('*, purchase_items(*)')
        .order('purchase_date', { ascending: false });

      if (error) {
        const simple = await supabase
          .from('purchases')
          .select('*')
          .order('purchase_date', { ascending: false });
        if (!simple.error && simple.data) {
          data = simple.data;
          error = null;
        }
      }

      if (!error && data && data.length > 0) {
        const supabaseIds = new Set(data.map((d: any) => d.purchase_number || d.id));
        const unsynced = localData.filter(
          (lp) => !supabaseIds.has(lp.purchase_number) && !supabaseIds.has(lp.id)
        );
        return [...(data as Purchase[]), ...unsynced];
      }
    } catch (err) {
      console.warn('Supabase getPurchases fallback to local store:', err);
    }
  }

  return localData;
}

export interface CreatePurchaseParams {
  supplierId?: string;
  supplierName: string;
  purchaseDate?: string;
  category?: 'restaurant' | 'lodging' | 'operational';
  invoiceNumber?: string;
  paymentMethod?: PaymentMethod;
  receiptImageUrl?: string;
  operatorName: string; // Siapa yang membeli bahan di tanggal itu
  notes?: string;
  isInventoryIntegrated?: boolean;

  // Single item convenience fields
  itemName?: string;
  unitType?: 'daging' | 'ekor' | 'pcs' | 'pax';
  weightKg?: number; // jika daging: membeli berapa kg
  quantity?: number; // jika ekor/pcs/pax
  unitPrice?: number;
  totalPrice?: number;
  inventoryId?: string;

  // Multi-item details (optional)
  items?: {
    inventoryId?: string;
    itemName: string;
    category?: string;
    unitType?: 'daging' | 'ekor' | 'pcs' | 'pax';
    quantity?: number;
    invoiceWeightKg?: number;
    receivedWeightKg?: number;
    receivedWeightGram?: number;
    unitPricePerKg?: number;
    subtotal: number;
    isStockItem?: boolean;
    notes?: string;
  }[];
}

export async function createPurchase(params: CreatePurchaseParams): Promise<Purchase> {
  const configured = isSupabaseConfigured();
  const purchaseNum = generatePurchaseNumber();
  const purchaseId = 'po_' + Date.now();
  const pDate = params.purchaseDate || new Date().toISOString().slice(0, 10);
  const pCategory = params.category || 'restaurant';
  const pPaymentMethod = params.paymentMethod || 'cash';
  const pOperator = params.operatorName || 'Purchasing Staff';

  // Construct items
  let finalItems: {
    inventoryId?: string | null;
    itemName: string;
    category: string;
    unitType: 'daging' | 'ekor' | 'pcs' | 'pax';
    quantity: number;
    invoiceWeightKg: number;
    receivedWeightKg: number;
    receivedWeightGram: number;
    unitPricePerKg: number;
    subtotal: number;
    isStockItem: boolean;
    notes?: string;
  }[] = [];

  if (params.items && params.items.length > 0) {
    finalItems = params.items.map((it) => {
      const uType = it.unitType || (it.invoiceWeightKg && it.invoiceWeightKg > 0 ? 'daging' : 'pcs');
      const qty = it.quantity || (uType === 'daging' ? (it.receivedWeightKg || it.invoiceWeightKg || 1) : 1);
      const isMeat = uType === 'daging';
      const rKg = it.receivedWeightKg ?? (isMeat ? qty : 0);
      const iKg = it.invoiceWeightKg ?? rKg;
      const rGram = it.receivedWeightGram ?? (isMeat ? Math.round(rKg * 1000) : 0);

      return {
        inventoryId: it.inventoryId || null,
        itemName: it.itemName,
        category: it.category || pCategory,
        unitType: uType,
        quantity: qty,
        invoiceWeightKg: iKg,
        receivedWeightKg: rKg,
        receivedWeightGram: rGram,
        unitPricePerKg: it.unitPricePerKg || (qty > 0 ? Math.round(it.subtotal / qty) : 0),
        subtotal: it.subtotal,
        isStockItem: it.isStockItem ?? isMeat,
        notes: it.notes || '',
      };
    });
  } else {
    // Single item from flat parameters
    const uType = params.unitType || 'daging';
    const isMeat = uType === 'daging';
    const weightKg = isMeat ? (params.weightKg || 1) : 0;
    const qty = isMeat ? weightKg : (params.quantity || 1);
    const rGram = isMeat ? Math.round(weightKg * 1000) : 0;

    let subtotal = params.totalPrice ?? 0;
    let unitPrice = params.unitPrice ?? 0;

    if (subtotal > 0 && unitPrice === 0) {
      unitPrice = qty > 0 ? Math.round(subtotal / qty) : 0;
    } else if (unitPrice > 0 && subtotal === 0) {
      subtotal = Math.round(qty * unitPrice);
    } else if (subtotal === 0 && unitPrice === 0) {
      unitPrice = 100000;
      subtotal = Math.round(qty * unitPrice);
    }

    finalItems = [
      {
        inventoryId: params.inventoryId || null,
        itemName: params.itemName || 'Bahan Belanja',
        category: pCategory,
        unitType: uType,
        quantity: qty,
        invoiceWeightKg: weightKg,
        receivedWeightKg: weightKg,
        receivedWeightGram: rGram,
        unitPricePerKg: unitPrice,
        subtotal: subtotal,
        isStockItem: params.isInventoryIntegrated ?? isMeat,
        notes: params.notes || `${qty} ${uType === 'daging' ? 'Kg' : uType}`,
      },
    ];
  }

  const totalAmount = finalItems.reduce((acc, it) => acc + it.subtotal, 0);
  const isIntegrated = params.isInventoryIntegrated ?? finalItems.some((it) => it.isStockItem);

  const purchaseRecord: Purchase = {
    id: purchaseId,
    purchase_number: purchaseNum,
    supplier_id: params.supplierId || null,
    supplier_name_snapshot: params.supplierName || 'Pemasok Umum',
    purchase_date: pDate,
    category: pCategory,
    invoice_number: params.invoiceNumber || '',
    total_amount: totalAmount,
    payment_method: pPaymentMethod,
    receipt_image_url: params.receiptImageUrl || '',
    operator_name: pOperator,
    notes: params.notes || '',
    is_inventory_integrated: isIntegrated,
    created_at: new Date().toISOString(),
    purchase_items: finalItems.map((it) => ({
      id: 'poi_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      purchase_id: purchaseId,
      inventory_id: it.inventoryId,
      item_name_snapshot: it.itemName,
      category: it.category,
      unit_type: it.unitType,
      quantity: it.quantity,
      invoice_weight_kg: it.invoiceWeightKg,
      received_weight_kg: it.receivedWeightKg,
      received_weight_gram: it.receivedWeightGram,
      unit_price_per_kg: it.unitPricePerKg,
      subtotal: it.subtotal,
      is_stock_item: it.isStockItem,
      notes: it.notes,
    })),
  };

  // 1. ALWAYS SAVE TO LOCALSTORAGE FOR INSTANT HISTORY PERSISTENCE
  if (typeof window !== 'undefined') {
    const existingPos: Purchase[] = JSON.parse(localStorage.getItem('asap_purchases_store') || '[]');
    localStorage.setItem('asap_purchases_store', JSON.stringify([purchaseRecord, ...existingPos]));
  }

  // 2. ALWAYS UPDATE LOCAL INVENTORY STOCK & STOCK MOVEMENTS
  if (isIntegrated) {
    const invItems = await getInventoryItems();
    const newMovements: StockMovement[] = [];

    const updatedInv = invItems.map((inv) => {
      const match = finalItems.find(
        (it) => it.isStockItem && ((it.inventoryId && it.inventoryId === inv.id) || it.itemName.toLowerCase() === inv.item_name.toLowerCase()) && it.receivedWeightGram > 0
      );
      if (match) {
        const newStock = inv.stock_gram + match.receivedWeightGram;
        newMovements.push({
          id: 'sm_' + Date.now() + '_' + inv.id,
          inventory_id: inv.id,
          movement_type: 'purchase',
          gram_change: match.receivedWeightGram,
          remaining_gram: newStock,
          reference_type: 'purchase',
          reference_id: purchaseRecord.id,
          notes: `Penerimaan Belanja ${purchaseNum}: ${match.itemName} (${match.receivedWeightKg} kg / ${match.quantity} ${match.unitType}) oleh ${pOperator}`,
          operator_name: pOperator,
          created_at: new Date().toISOString(),
        });
        return { ...inv, stock_gram: newStock, updated_at: new Date().toISOString() };
      }
      return inv;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('asap_inventory_store', JSON.stringify(updatedInv));
      if (newMovements.length > 0) {
        const existingMovs: StockMovement[] = JSON.parse(localStorage.getItem('asap_stock_movements_store') || '[]');
        localStorage.setItem('asap_stock_movements_store', JSON.stringify([...newMovements, ...existingMovs]));
      }
    }
  }

  // 3. TRY TO SAVE TO SUPABASE (WITH GRACEFUL UUID VALIDATION)
  if (configured) {
    try {
      const supabase = createClient();
      const validSupplierId = isValidUUID(params.supplierId) ? params.supplierId : null;

      const { data: savedPo, error } = await supabase
        .from('purchases')
        .insert({
          purchase_number: purchaseNum,
          supplier_id: validSupplierId,
          supplier_name_snapshot: purchaseRecord.supplier_name_snapshot,
          purchase_date: purchaseRecord.purchase_date,
          category: purchaseRecord.category,
          invoice_number: purchaseRecord.invoice_number || null,
          total_amount: totalAmount,
          payment_method: purchaseRecord.payment_method,
          receipt_image_url: purchaseRecord.receipt_image_url || null,
          operator_name: purchaseRecord.operator_name,
          notes: purchaseRecord.notes || null,
          is_inventory_integrated: purchaseRecord.is_inventory_integrated,
        })
        .select()
        .single();

      if (!error && savedPo) {
        const poItems = finalItems.map((pi) => ({
          purchase_id: savedPo.id,
          inventory_id: isValidUUID(pi.inventoryId) ? pi.inventoryId : null,
          item_name_snapshot: pi.itemName,
          category: pi.category,
          invoice_weight_kg: pi.invoiceWeightKg,
          received_weight_kg: pi.receivedWeightKg,
          received_weight_gram: pi.receivedWeightGram,
          unit_price_per_kg: pi.unitPricePerKg,
          subtotal: pi.subtotal,
          is_stock_item: pi.isStockItem,
          notes: pi.notes,
        }));
        await supabase.from('purchase_items').insert(poItems);

        // Supabase stock increment
        if (isIntegrated) {
          for (const it of finalItems) {
            if (it.isStockItem && isValidUUID(it.inventoryId) && it.receivedWeightGram > 0) {
              const { data: inv } = await supabase.from('inventory').select('stock_gram').eq('id', it.inventoryId).single();
              if (inv) {
                const newStock = inv.stock_gram + it.receivedWeightGram;
                await supabase.from('inventory').update({ stock_gram: newStock }).eq('id', it.inventoryId);
                await supabase.from('stock_movements').insert({
                  inventory_id: it.inventoryId,
                  movement_type: 'purchase',
                  gram_change: it.receivedWeightGram,
                  remaining_gram: newStock,
                  reference_type: 'purchase',
                  reference_id: savedPo.id,
                  notes: `Penerimaan Pembelian ${purchaseNum} oleh ${pOperator}`,
                  operator_name: pOperator,
                });
              }
            }
          }
        }

        // Return combined object with Supabase ID
        return {
          ...purchaseRecord,
          id: savedPo.id,
        };
      }
    } catch (err) {
      console.warn('Supabase createPurchase fallback (saved to local):', err);
    }
  }

  return purchaseRecord;
}

export async function deletePurchase(purchaseId: string): Promise<boolean> {
  const configured = isSupabaseConfigured();

  if (configured && isValidUUID(purchaseId)) {
    try {
      const supabase = createClient();
      await supabase.from('purchases').delete().eq('id', purchaseId);
    } catch (e) {
      console.warn('Supabase deletePurchase warning:', e);
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_purchases_store');
    if (stored) {
      try {
        const list: Purchase[] = JSON.parse(stored);
        const filtered = list.filter((p) => p.id !== purchaseId && p.purchase_number !== purchaseId);
        localStorage.setItem('asap_purchases_store', JSON.stringify(filtered));
      } catch {
        // Fallback
      }
    }
  }

  return true;
}
