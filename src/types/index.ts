export type Currency = 'ARS' | 'USD';

export interface Workspace {
  id: string;
  name: string;
  pin_hash: string | null;
  default_currency: Currency;
  created_at: string;
}

export interface Member {
  id: string;
  workspace_id: string;
  user_id: string;
  display_name: string;
  role: 'owner' | 'member';
  created_at: string;
}

export interface Category {
  id: string;
  workspace_id: string;
  name: string;
  keywords: string[];
  icon: string;
  color: string;
  is_default: boolean;
  sort_order: number;
}

export interface Expense {
  id: string;
  workspace_id: string;
  member_id: string;
  amount: number;
  currency: Currency;
  amount_ars: number | null;
  amount_usd: number | null;
  description: string;
  category_id: string;
  date: string;
  created_at: string;
  categories?: { name: string; color: string; icon: string };
  members?: { display_name: string };
}

export interface ParsedExpense {
  amount: number;
  currency: Currency;
  description: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
}

export interface BlueRate {
  compra: number;
  venta: number;
  fetchedAt: string;
}
