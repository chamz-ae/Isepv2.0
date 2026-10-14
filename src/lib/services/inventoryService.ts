import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import {
  InventoryItem,
  StockMovement,
  CookingBatch,
  StockOpname,
  StockOpnameItem,
  MeatType,
} from '@/lib/supabase/types';
import { calculateYield, generateBatchNumber, generateOpnameNumber } from '@/lib/utils/formatters';

export const INITIAL_INVENTORY_ITEMS: InventoryItem[] = [
  // Raw Meats
  { id: 'inv_raw_01', item_name: 'USDA Prime Brisket (Raw)', category: 'raw_meat', meat_type: 'brisket', stock_gram: 0, minimum_stock_gram: 5000, unit_cost_per_kg: 180000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_raw_02', item_name: 'Ayam Karkas Segar (Raw)', category: 'raw_meat', meat_type: 'ayam', stock_gram: 0, minimum_stock_gram: 3000, unit_cost_per_kg: 45000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_raw_03', item_name: 'Daging Domba Segar (Raw)', category: 'raw_meat', meat_type: 'domba', stock_gram: 0, minimum_stock_gram: 4000, unit_cost_per_kg: 140000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_raw_04', item_name: 'Ikan Marlin Segar (Raw)', category: 'raw_meat', meat_type: 'marlin', stock_gram: 0, minimum_stock_gram: 3000, unit_cost_per_kg: 85000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_raw_05', item_name: 'Ikan Lele Segar (Raw)', category: 'raw_meat', meat_type: 'lele', stock_gram: 0, minimum_stock_gram: 2000, unit_cost_per_kg: 30000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_raw_06', item_name: 'Fillet Salmon Segar (Raw)', category: 'raw_meat', meat_type: 'salmon', stock_gram: 0, minimum_stock_gram: 2000, unit_cost_per_kg: 240000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_raw_07', item_name: 'Bebek Karkas Segar (Raw)', category: 'raw_meat', meat_type: 'bebek', stock_gram: 0, minimum_stock_gram: 3000, unit_cost_per_kg: 65000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_raw_08', item_name: 'Lidah Sapi Utuh (Raw)', category: 'raw_meat', meat_type: 'lidah_sapi', stock_gram: 0, minimum_stock_gram: 2000, unit_cost_per_kg: 130000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },

  // Cooked / Smoked Ready Meats
  { id: 'inv_cooked_01', item_name: 'Brisket Asap 14-Jam (Cooked)', category: 'cooked_meat', meat_type: 'brisket', stock_gram: 0, minimum_stock_gram: 3000, unit_cost_per_kg: 320000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_cooked_02', item_name: 'Ayam Asap Siap Saji (Cooked)', category: 'cooked_meat', meat_type: 'ayam', stock_gram: 0, minimum_stock_gram: 2000, unit_cost_per_kg: 75000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_cooked_03', item_name: 'Domba Asap Kerecek (Cooked)', category: 'cooked_meat', meat_type: 'domba', stock_gram: 0, minimum_stock_gram: 2000, unit_cost_per_kg: 220000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_cooked_04', item_name: 'Marlin Asap Siap Saji (Cooked)', category: 'cooked_meat', meat_type: 'marlin', stock_gram: 0, minimum_stock_gram: 1500, unit_cost_per_kg: 140000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_cooked_05', item_name: 'Mangut Lele Asap (Cooked)', category: 'cooked_meat', meat_type: 'lele', stock_gram: 0, minimum_stock_gram: 1000, unit_cost_per_kg: 50000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_cooked_06', item_name: 'Salmon Asap Siap Saji (Cooked)', category: 'cooked_meat', meat_type: 'salmon', stock_gram: 0, minimum_stock_gram: 1000, unit_cost_per_kg: 380000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_cooked_07', item_name: 'Bebek Asap Siap Saji (Cooked)', category: 'cooked_meat', meat_type: 'bebek', stock_gram: 0, minimum_stock_gram: 1500, unit_cost_per_kg: 110000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'inv_cooked_08', item_name: 'Lidah Sapi Asap (Cooked)', category: 'cooked_meat', meat_type: 'lidah_sapi', stock_gram: 0, minimum_stock_gram: 1000, unit_cost_per_kg: 210000, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

export async function getInventoryItems(): Promise<InventoryItem[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('inventory').select('*').order('item_name', { ascending: true });
      if (!error && data && data.length > 0) return data as InventoryItem[];
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_inventory_store');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fallback
      }
    }
    localStorage.setItem('asap_inventory_store', JSON.stringify(INITIAL_INVENTORY_ITEMS));
  }

  return INITIAL_INVENTORY_ITEMS;
}

export async function getStockMovements(inventoryId?: string): Promise<StockMovement[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      let query = supabase.from('stock_movements').select('*, inventory:inventory_id(*)');
      if (inventoryId) {
        query = query.eq('inventory_id', inventoryId);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data) return data as StockMovement[];
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_stock_movements_store');
    if (stored) {
      try {
        const list: StockMovement[] = JSON.parse(stored);
        if (inventoryId) return list.filter((m) => m.inventory_id === inventoryId);
        return list;
      } catch {
        // Fallback
      }
    }
  }

  return [];
}

export async function processCookingBatch(params: {
  rawInventoryId: string;
  cookedInventoryId: string;
  rawWeightGram: number;
  cookedWeightGram: number;
  lossReason: string;
  operatorName: string;
  notes?: string;
}): Promise<CookingBatch> {
  const configured = isSupabaseConfigured();
  const { yieldPercentage, lossWeightGram } = calculateYield(params.rawWeightGram, params.cookedWeightGram);
  const batchNum = generateBatchNumber();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc('rpc_process_cooking_batch_atomic', {
        p_raw_inv_id: params.rawInventoryId,
        p_cooked_inv_id: params.cookedInventoryId,
        p_raw_gram: params.rawWeightGram,
        p_cooked_gram: params.cookedWeightGram,
        p_loss_reason: params.lossReason,
        p_operator: params.operatorName,
        p_notes: params.notes || null,
      });
      if (!error && data?.batch_id) {
        const { data: batch } = await supabase.from('cooking_batches').select('*').eq('id', data.batch_id).single();
        if (batch) return batch as CookingBatch;
      }
    } catch (err) {
      console.error('Cooking batch rpc error:', err);
    }
  }

  // Local storage atomic simulation
  const items = await getInventoryItems();
  const rawItem = items.find((i) => i.id === params.rawInventoryId);
  const cookedItem = items.find((i) => i.id === params.cookedInventoryId);

  if (!rawItem || !cookedItem) throw new Error('Item inventori tidak ditemukan');
  if (rawItem.stock_gram < params.rawWeightGram) {
    throw new Error(`Stok mentah ${rawItem.item_name} tidak mencukupi (Tersedia: ${rawItem.stock_gram}g)`);
  }

  const newRawStock = rawItem.stock_gram - params.rawWeightGram;
  const newCookedStock = cookedItem.stock_gram + params.cookedWeightGram;

  const updatedItems = items.map((i) => {
    if (i.id === params.rawInventoryId) return { ...i, stock_gram: newRawStock };
    if (i.id === params.cookedInventoryId) return { ...i, stock_gram: newCookedStock };
    return i;
  });

  const batch: CookingBatch = {
    id: 'batch_' + Date.now(),
    batch_number: batchNum,
    raw_inventory_id: params.rawInventoryId,
    cooked_inventory_id: params.cookedInventoryId,
    raw_weight_gram: params.rawWeightGram,
    cooked_weight_gram: params.cookedWeightGram,
    loss_weight_gram: lossWeightGram,
    yield_percentage: yieldPercentage,
    loss_reason: params.lossReason as any,
    batch_date: new Date().toISOString().slice(0, 10),
    operator_name: params.operatorName,
    notes: params.notes,
    created_at: new Date().toISOString(),
  };

  const movements: StockMovement[] = [
    {
      id: 'sm_' + Date.now() + '_raw',
      inventory_id: params.rawInventoryId,
      movement_type: 'cooking_raw_deduction',
      gram_change: -params.rawWeightGram,
      remaining_gram: newRawStock,
      reference_type: 'cooking_batch',
      reference_id: batch.id,
      notes: `Pengurangan mentah batch ${batchNum}`,
      operator_name: params.operatorName,
      created_at: new Date().toISOString(),
    },
    {
      id: 'sm_' + Date.now() + '_cooked',
      inventory_id: params.cookedInventoryId,
      movement_type: 'cooking_cooked_addition',
      gram_change: params.cookedWeightGram,
      remaining_gram: newCookedStock,
      reference_type: 'cooking_batch',
      reference_id: batch.id,
      notes: `Penambahan matang batch ${batchNum}`,
      operator_name: params.operatorName,
      created_at: new Date().toISOString(),
    },
  ];

  if (typeof window !== 'undefined') {
    localStorage.setItem('asap_inventory_store', JSON.stringify(updatedItems));

    const existingBatches: CookingBatch[] = JSON.parse(localStorage.getItem('asap_cooking_batches_store') || '[]');
    localStorage.setItem('asap_cooking_batches_store', JSON.stringify([batch, ...existingBatches]));

    const existingMovements: StockMovement[] = JSON.parse(localStorage.getItem('asap_stock_movements_store') || '[]');
    localStorage.setItem('asap_stock_movements_store', JSON.stringify([...movements, ...existingMovements]));
  }

  return batch;
}

export async function getCookingBatches(): Promise<CookingBatch[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('cooking_batches').select('*').order('created_at', { ascending: false });
      if (!error && data) return data as CookingBatch[];
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_cooking_batches_store');
    if (stored) return JSON.parse(stored);
  }

  return [];
}

export async function getStockOpnames(): Promise<StockOpname[]> {
  const configured = isSupabaseConfigured();

  if (configured) {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('stock_opnames').select('*, items:stock_opname_items(*)').order('created_at', { ascending: false });
      if (!error && data) return data as StockOpname[];
    } catch {
      // Fallback
    }
  }

  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('asap_stock_opnames_store');
    if (stored) return JSON.parse(stored);
  }

  return [];
}

export async function saveStockOpname(params: {
  operatorName: string;
  notes?: string;
  items: { inventoryId: string; itemName: string; systemGram: number; actualGram: number; reason: string; unitCostPerKg: number }[];
  isConfirmed: boolean;
}): Promise<StockOpname> {
  const configured = isSupabaseConfigured();
  const opnameNum = generateOpnameNumber();

  let totalVarianceGram = 0;
  let totalVarianceCost = 0;

  const preparedItems = params.items.map((i) => {
    const varianceGram = i.actualGram - i.systemGram;
    const varianceCost = (varianceGram / 1000) * i.unitCostPerKg;
    totalVarianceGram += varianceGram;
    totalVarianceCost += varianceCost;
    return {
      id: 'soi_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      stock_opname_id: '',
      inventory_id: i.inventoryId,
      item_name_snapshot: i.itemName,
      system_gram: i.systemGram,
      actual_gram: i.actualGram,
      variance_gram: varianceGram,
      variance_cost: varianceCost,
      reason: i.reason,
      created_at: new Date().toISOString(),
    };
  });

  const opnameRecord: StockOpname = {
    id: 'so_' + Date.now(),
    opname_number: opnameNum,
    opname_date: new Date().toISOString().slice(0, 10),
    operator_name: params.operatorName,
    status: params.isConfirmed ? 'confirmed' : 'draft',
    total_variance_gram: totalVarianceGram,
    total_variance_cost: totalVarianceCost,
    notes: params.notes,
    created_at: new Date().toISOString(),
    items: preparedItems,
  };

  preparedItems.forEach((item) => (item.stock_opname_id = opnameRecord.id));

  if (configured) {
    try {
      const supabase = createClient();
      const { data: savedOpname, error } = await supabase
        .from('stock_opnames')
        .insert({
          opname_number: opnameNum,
          opname_date: opnameRecord.opname_date,
          operator_name: params.operatorName,
          status: opnameRecord.status,
          total_variance_gram: totalVarianceGram,
          total_variance_cost: totalVarianceCost,
          notes: params.notes,
        })
        .select()
        .single();

      if (!error && savedOpname) {
        const itemsToInsert = preparedItems.map((pi) => ({
          stock_opname_id: savedOpname.id,
          inventory_id: pi.inventory_id,
          item_name_snapshot: pi.item_name_snapshot,
          system_gram: pi.system_gram,
          actual_gram: pi.actual_gram,
          variance_gram: pi.variance_gram,
          variance_cost: pi.variance_cost,
          reason: pi.reason,
        }));
        await supabase.from('stock_opname_items').insert(itemsToInsert);

        if (params.isConfirmed) {
          await supabase.rpc('rpc_apply_stock_opname_atomic', {
            p_opname_id: savedOpname.id,
            p_operator: params.operatorName,
          });
        }
        return savedOpname as StockOpname;
      }
    } catch (err) {
      console.error('Save opname rpc error:', err);
    }
  }

  // Local storage simulation
  if (params.isConfirmed) {
    const invItems = await getInventoryItems();
    const newMovements: StockMovement[] = [];

    const updatedInv = invItems.map((inv) => {
      const opItem = preparedItems.find((pi) => pi.inventory_id === inv.id);
      if (opItem) {
        newMovements.push({
          id: 'sm_' + Date.now() + '_' + inv.id,
          inventory_id: inv.id,
          movement_type: 'stock_opname_adjustment',
          gram_change: opItem.variance_gram,
          remaining_gram: opItem.actual_gram,
          reference_type: 'stock_opname',
          reference_id: opnameRecord.id,
          notes: `Penyesuaian Opname ${opnameNum}: ${opItem.reason}`,
          operator_name: params.operatorName,
          created_at: new Date().toISOString(),
        });
        return { ...inv, stock_gram: opItem.actual_gram };
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
    const existingOpnames: StockOpname[] = JSON.parse(localStorage.getItem('asap_stock_opnames_store') || '[]');
    localStorage.setItem('asap_stock_opnames_store', JSON.stringify([opnameRecord, ...existingOpnames]));
  }

  return opnameRecord;
}
