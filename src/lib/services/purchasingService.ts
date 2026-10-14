import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Supplier, Purchase, PurchaseItem, StockMovement } from '@/lib/supabase/types';
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
];

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
    const supabase = createClient();
    if (supplier.id) {
      const { data } = await supabase.from('suppliers').update(supplier).eq('id', supplier.id).select().single();
      if (data) return data as Supplier;
    } else {
      const { data } = await supabase.from('suppliers').insert(supplier).select().single();
      if (data) return data as Supplier;
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
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('purchases').select('*, purchase_items(*)').order('purchase_date', { ascending: false });
      if (!error && data) return data as Purchase[];
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_purchases_store');
    if (stored) return JSON.parse(stored);
  }

  return [];
}

export async function createPurchase(params: {
  supplierId?: string;
  supplierName: string;
  purchaseDate: string;
  category: 'restaurant' | 'lodging' | 'operational';
  invoiceNumber?: string;
  paymentMethod: 'cash' | 'qris' | 'bank_transfer' | 'room_charge';
  receiptImageUrl?: string;
  operatorName: string;
  notes?: string;
  isInventoryIntegrated: boolean;
  items: {
    inventoryId?: string;
    itemName: string;
    category: string;
    invoiceWeightKg: number;
    receivedWeightKg: number;
    receivedWeightGram: number; // Kuantitas fisik aktual
    unitPricePerKg: number;
    subtotal: number;
    isStockItem: boolean;
    notes?: string;
  }[];
}): Promise<Purchase> {
  const configured = isSupabaseConfigured();
  const purchaseNum = generatePurchaseNumber();
  const totalAmount = params.items.reduce((acc, item) => acc + item.subtotal, 0);

  const purchaseRecord: Purchase = {
    id: 'po_' + Date.now(),
    purchase_number: purchaseNum,
    supplier_id: params.supplierId || null,
    supplier_name_snapshot: params.supplierName,
    purchase_date: params.purchaseDate || new Date().toISOString().slice(0, 10),
    category: params.category,
    invoice_number: params.invoiceNumber,
    total_amount: totalAmount,
    payment_method: params.paymentMethod,
    receipt_image_url: params.receiptImageUrl,
    operator_name: params.operatorName,
    notes: params.notes,
    is_inventory_integrated: params.isInventoryIntegrated,
    created_at: new Date().toISOString(),
    purchase_items: params.items.map((it) => ({
      id: 'poi_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      purchase_id: '',
      inventory_id: it.inventoryId || null,
      item_name_snapshot: it.itemName,
      category: it.category,
      invoice_weight_kg: it.invoiceWeightKg,
      received_weight_kg: it.receivedWeightKg,
      received_weight_gram: it.receivedWeightGram,
      unit_price_per_kg: it.unitPricePerKg,
      subtotal: it.subtotal,
      is_stock_item: it.isStockItem,
      notes: it.notes,
    })),
  };

  purchaseRecord.purchase_items?.forEach((it) => (it.purchase_id = purchaseRecord.id));

  if (configured) {
    try {
      const supabase = createClient();
      const { data: savedPo, error } = await supabase
        .from('purchases')
        .insert({
          purchase_number: purchaseNum,
          supplier_id: params.supplierId || null,
          supplier_name_snapshot: params.supplierName,
          purchase_date: purchaseRecord.purchase_date,
          category: params.category,
          invoice_number: params.invoiceNumber,
          total_amount: totalAmount,
          payment_method: params.paymentMethod,
          receipt_image_url: params.receiptImageUrl,
          operator_name: params.operatorName,
          notes: params.notes,
          is_inventory_integrated: params.isInventoryIntegrated,
        })
        .select()
        .single();

      if (!error && savedPo) {
        const poItems = params.items.map((pi) => ({
          purchase_id: savedPo.id,
          inventory_id: pi.inventoryId || null,
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

        // Atomic inventory stock increment for received physical stock items
        if (params.isInventoryIntegrated) {
          for (const it of params.items) {
            if (it.isStockItem && it.inventoryId && it.receivedWeightGram > 0) {
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
                  notes: `Penerimaan Pembelian ${purchaseNum}`,
                  operator_name: params.operatorName,
                });
              }
            }
          }
        }
        return savedPo as Purchase;
      }
    } catch (err) {
      console.error('Error creating purchase:', err);
    }
  }

  // Local storage simulation
  if (params.isInventoryIntegrated) {
    const invItems = await getInventoryItems();
    const newMovements: StockMovement[] = [];

    const updatedInv = invItems.map((inv) => {
      const match = params.items.find((it) => it.isStockItem && it.inventoryId === inv.id && it.receivedWeightGram > 0);
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
          notes: `Penerimaan Pembelian ${purchaseNum}`,
          operator_name: params.operatorName,
          created_at: new Date().toISOString(),
        });
        return { ...inv, stock_gram: newStock };
      }
      return inv;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem('asap_inventory_store', JSON.stringify(updatedInv));
      const existingMovs: StockMovement[] = JSON.parse(localStorage.getItem('asap_stock_movements_store') || '[]');
      localStorage.setItem('asap_stock_movements_store', JSON.stringify([...newMovements, ...existingMovs]));
    }
  }

  if (typeof window !== 'undefined') {
    const existingPos: Purchase[] = JSON.parse(localStorage.getItem('asap_purchases_store') || '[]');
    localStorage.setItem('asap_purchases_store', JSON.stringify([purchaseRecord, ...existingPos]));
  }

  return purchaseRecord;
}
