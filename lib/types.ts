export type Mode = "mobilhome" | "emporter" | "table";
export type Role = "admin" | "editeur" | "lecteur";
export type OrderStatus =
  | "en_attente_paiement"
  | "nouvelle"
  | "en_preparation"
  | "prete"
  | "terminee"
  | "annulee";

export type Settings = {
  address: string | null;
  hours: string | null;
  phone: string | null;
  contact_email: string | null;
  instagram_url: string | null;
  ubereats_url: string | null;
  camping_name: string | null;
  opening_label: string | null;
  ordering_open: boolean;
  loyalty_enabled?: boolean;
  loyalty_goal?: number;
  loyalty_reward_cents?: number;
  loyalty_reward_label?: string;
  legal_name?: string | null;
  legal_address?: string | null;
  siret?: string | null;
  vat_number?: string | null;
  invoice_footer?: string | null;
};

export type MenuCategory = { id: string; name: string; moment: string | null; position: number; active: boolean };
export type MenuItem = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price_cents: number;
  available: boolean;
  position: number;
  stock_item_id: string | null;
  vat_rate: number;
  cost_cents: number | null;
};
export type StockItem = {
  id: string;
  name: string;
  section: "sec" | "frais" | "surgele";
  unit: string;
  quantity: number;
  alert_threshold: number;
  updated_at: string;
  purchase_price_cents: number | null;
  vat_rate: number;
  sale_price_cents: number | null;
  supplier: string | null;
};
export type OrderItem = { id: string; name: string; unit_price_cents: number; quantity: number; vat_rate?: number; menu_item_id?: string | null };
export type Order = {
  id: string;
  number: number;
  user_id: string | null;
  mode: Mode;
  location: string | null;
  note: string | null;
  status: OrderStatus;
  total_cents: number;
  paid_at: string | null;
  created_at: string;
  customer_name?: string | null;
  customer_email?: string | null;
  invoice_number?: string | null;
  invoiced_at?: string | null;
  is_demo?: boolean;
  customer_phone?: string | null;
  source?: "en_ligne" | "equipe";
  payment_method?: "en_ligne" | "terminal" | "especes" | null;
  sms_ready_sent_at?: string | null;
  order_items?: OrderItem[];
  profiles?: { first_name: string | null; last_name: string | null; email: string | null } | null;
};
