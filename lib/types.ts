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
};
export type StockItem = {
  id: string;
  name: string;
  section: "sec" | "frais" | "surgele";
  unit: string;
  quantity: number;
  alert_threshold: number;
  updated_at: string;
};
export type OrderItem = { id: string; name: string; unit_price_cents: number; quantity: number };
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
  order_items?: OrderItem[];
  profiles?: { first_name: string | null; last_name: string | null; email: string | null } | null;
};
