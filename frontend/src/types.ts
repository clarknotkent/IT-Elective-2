// === Domain Types ===

export interface Ingredient {
  id: number;
  name: string;
  ingredient_type: string;
  type_label?: string;
  created_at?: string;
  inventory_count?: number;
}

export type IngredientTypeSlug =
  | 'alcoholic'
  | 'non-alcoholic'
  | 'fruits'
  | 'non-perishable'
  | 'other';

export const INGREDIENT_TYPES: { slug: IngredientTypeSlug; label: string }[] = [
  { slug: 'alcoholic', label: 'Alcoholic' },
  { slug: 'non-alcoholic', label: 'Non-Alcoholic' },
  { slug: 'fruits', label: 'Fruits' },
  { slug: 'non-perishable', label: 'Non-Perishable' },
  { slug: 'other', label: 'Other' },
];

export interface InventoryItem {
  id: number;
  ingredient_id: number;
  product_name?: string;
  category?: string;
  quantity: number;
  stock: number;
  event_date?: string;
  location?: string | null;
  is_low_stock?: boolean;
}

export interface StockMovement {
  id?: number;
  item_id?: number;
  product_name?: string;
  movement_type: string;
  quantity: number;
  note?: string;
  created_at?: string;
  type_label?: string;
}

export interface PreparationTransfer {
  id: number;
  source_item_id?: number;
  product_name?: string;
  quantity: number;
  booking_date?: string;
  transferred_at?: string;
}

export interface DashboardStats {
  ingredient_count: number;
  inventory_count: number;
  low_stock_count: number;
}

// === API Types ===

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface StockResponse {
  items: InventoryItem[];
  recent_movements: StockMovement[];
}
