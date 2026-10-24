// ============================================================
// ASAP ISEP — MASTER TYPESCRIPT DEFINITIONS
// Covers all domains: Auth, Guests, Rooms, Tables, Menus,
// Orders, Order Items, Payments, Cashier Closings,
// Suppliers, Inventory, Purchases, Cooking Batches,
// Stock Opname, Gallery, Webhooks, Audit Logs, Settings.
// ============================================================

export type UserRole = 'owner' | 'admin' | 'kasir' | 'kitchen' | 'housekeeping' | 'purchasing';

export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'blocked';

export type TableStatus = 'available' | 'occupied' | 'reserved';

export type OrderType = 'restaurant' | 'lodging' | 'combined';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export type PaymentStatus = 'unpaid' | 'down_payment' | 'paid' | 'refunded';

export type PaymentMethod = 'cash' | 'qris' | 'bank_transfer' | 'room_charge';

export type MeatType = 'brisket' | 'ayam' | 'domba' | 'marlin' | 'lele' | 'salmon' | 'bebek' | 'lidah_sapi' | 'none';

export type PriceBasis = 'per_portion' | 'per_gram' | 'per_100g' | 'per_ekor' | 'per_package';

export type StockMovementType =
  | 'purchase'
  | 'usage'
  | 'cooking_raw_deduction'
  | 'cooking_cooked_addition'
  | 'stock_opname_adjustment'
  | 'void_return'
  | 'waste'
  | 'spoilage'
  | 'operational_loss';

export type PurchaseCategory = 'restaurant' | 'lodging' | 'operational';

export type GalleryStatus = 'pending' | 'approved' | 'rejected';

export type KdsStatus = 'pending' | 'preparing' | 'ready' | 'served';

// 1. Profile
export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  phone?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 2. Guest
export interface Guest {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  notes?: string | null;
  valid_visits_count: number;
  is_loyal: boolean; // Pelanggan Setia if valid_visits_count >= 2
  total_spend: number;
  last_visit_at?: string | null;
  created_at: string;
  updated_at: string;
}

// 3. Room
export interface Room {
  id: string;
  room_number: string;
  room_name: string;
  room_type: string;
  price_per_night: number;
  capacity: number;
  description?: string | null;
  facilities: string[];
  status: RoomStatus;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 4. Restaurant Table
export interface RestaurantTable {
  id: string;
  table_number: string;
  capacity: number;
  status: TableStatus;
  location_notes?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 5. Menu Category & Menu
export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  display_order: number;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  access_scope: 'restaurant' | 'lodging' | 'both';
  price: number;
  price_basis: PriceBasis;
  price_range_min?: number | null;
  price_range_max?: number | null;
  meat_type: MeatType;
  standard_meat_gram: number;
  min_meat_gram: number;
  is_fixed_gram: boolean;
  is_available: boolean;
  is_active: boolean;
  image_url?: string | null;
  created_at: string;
  updated_at: string;
}

// 6. Order & Order Item
export interface Order {
  id: string;
  booking_code: string;
  guest_id?: string | null;
  guest_name: string;
  guest_phone: string;
  guest_email?: string | null;
  order_type: OrderType;

  // Lodging
  room_id?: string | null;
  room_name_snapshot?: string | null;
  check_in_date?: string | null;
  check_out_date?: string | null;
  adult_count: number;
  teen_count: number;
  child_count: number;
  lodging_price_per_person_snapshot: number;
  subtotal_lodging: number;

  // Restaurant
  table_id?: string | null;
  table_number_snapshot?: string | null;
  subtotal_dining: number;

  // Financials
  total_amount: number;
  down_payment: number;
  paid_amount: number;
  remaining_amount: number;

  // Status
  order_status: OrderStatus;
  payment_status: PaymentStatus;

  // Cancellation
  notes?: string | null;
  operator_name?: string | null;
  cancellation_reason?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;

  created_at: string;
  updated_at: string;

  // Joined relations
  order_items?: OrderItem[];
  payments?: Payment[];
  room?: Room | null;
  table?: RestaurantTable | null;
  guest?: Guest | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_id?: string | null;
  menu_name_snapshot: string;
  unit_price_snapshot: number;
  meat_type: MeatType;
  gram_per_portion: number;
  qty: number;
  total_gram: number;
  subtotal: number;
  kds_status: KdsStatus;
  kds_notes?: string | null;
  inventory_deducted: boolean;
  created_at: string;
}

// 7. Payment
export interface Payment {
  id: string;
  payment_number: string;
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  is_down_payment: boolean;
  status: 'confirmed' | 'voided';
  reference_number?: string | null;
  notes?: string | null;
  operator_name: string;
  paid_at: string;
  created_at: string;
}

// 8. Cashier Closing
export interface CashierClosing {
  id: string;
  closing_number: string;
  closing_date: string;
  opened_at: string;
  closed_at: string;
  operator_name: string;
  expected_cash: number;
  actual_cash: number;
  cash_variance: number;
  qris_total: number;
  transfer_total: number;
  room_charge_total: number;
  total_revenue: number;
  total_transactions: number;
  notes?: string | null;
  created_at: string;
}

// 9. Supplier & Purchasing
export interface Supplier {
  id: string;
  supplier_name: string;
  contact_person?: string | null;
  phone: string;
  address?: string | null;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Purchase {
  id: string;
  purchase_number: string;
  supplier_id?: string | null;
  supplier_name_snapshot: string;
  purchase_date: string;
  category: PurchaseCategory;
  invoice_number?: string | null;
  total_amount: number;
  payment_method: PaymentMethod;
  receipt_image_url?: string | null;
  operator_name: string;
  notes?: string | null;
  is_inventory_integrated: boolean;
  created_at: string;
  purchase_items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  inventory_id?: string | null;
  item_name_snapshot: string;
  category: string;
  invoice_weight_kg: number;
  received_weight_kg: number;
  received_weight_gram: number;
  unit_price_per_kg: number;
  subtotal: number;
  is_stock_item: boolean;
  notes?: string | null;
  unit_type?: 'daging' | 'ekor' | 'pcs' | 'pax';
  quantity?: number;
}

// 10. Meat & Supplies Inventory (Base unit: GRAM)
export interface InventoryItem {
  id: string;
  item_name: string;
  category: 'raw_meat' | 'cooked_meat' | 'supplies' | 'general';
  meat_type: MeatType;
  stock_gram: number;
  minimum_stock_gram: number;
  unit_cost_per_kg: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockMovement {
  id: string;
  inventory_id: string;
  movement_type: StockMovementType;
  gram_change: number;
  remaining_gram: number;
  reference_type?: string | null;
  reference_id?: string | null;
  notes?: string | null;
  operator_name?: string | null;
  created_at: string;
  inventory?: InventoryItem;
}

// 11. Cooking Batch & Yield Tracking
export interface CookingBatch {
  id: string;
  batch_number: string;
  raw_inventory_id: string;
  cooked_inventory_id: string;
  raw_weight_gram: number;
  cooked_weight_gram: number;
  loss_weight_gram: number;
  yield_percentage: number;
  loss_reason:
    | 'trimming'
    | 'cooking_shrinkage'
    | 'bone'
    | 'waste'
    | 'spoilage'
    | 'operational_loss'
    | 'unknown';
  batch_date: string;
  operator_name: string;
  notes?: string | null;
  created_at: string;
  raw_item?: InventoryItem;
  cooked_item?: InventoryItem;
}

// 12. Stock Opname & Variance
export interface StockOpname {
  id: string;
  opname_number: string;
  opname_date: string;
  operator_name: string;
  status: 'draft' | 'confirmed';
  total_variance_gram: number;
  total_variance_cost: number;
  notes?: string | null;
  created_at: string;
  items?: StockOpnameItem[];
}

export interface StockOpnameItem {
  id: string;
  stock_opname_id: string;
  inventory_id: string;
  item_name_snapshot: string;
  system_gram: number;
  actual_gram: number;
  variance_gram: number;
  variance_cost: number;
  reason: string;
  created_at: string;
}

// 13. Gallery
export interface GallerySubmission {
  id: string;
  booking_code: string;
  guest_name: string;
  image_url: string;
  caption?: string | null;
  category: 'dining' | 'stay';
  status: GalleryStatus;
  consent_granted: boolean;
  submitted_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
}

// 14. Webhook & Logs
export interface WebhookIntegration {
  id: string;
  label: string;
  webhook_url: string;
  secret_token?: string | null;
  trigger_events: string[];
  is_active: boolean;
  last_status_code?: number | null;
  last_delivery_at?: string | null;
  last_error?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookLog {
  id: string;
  webhook_id: string;
  event: string;
  payload: Record<string, unknown>;
  status_code?: number | null;
  response_body?: string | null;
  success: boolean;
  error_message?: string | null;
  attempted_at: string;
}

// 15. Audit Log
export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  performed_by?: string | null;
  created_at: string;
}

// 16. Business Settings
export interface BusinessSettings {
  id: string;
  business_name: string;
  whatsapp_number: string;
  address: string;
  default_lodging_price_per_person: number;
  auto_backup_enabled: boolean;
  auto_backup_schedule: string;
  updated_at: string;
}
