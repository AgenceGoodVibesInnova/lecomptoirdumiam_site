import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Mode } from "./format";
import type { Item } from "./menu";

export type Line = { id: string; name: string; price_cents: number; qty: number };
type Ctx = {
  mode: Mode | null;
  location: string;
  lines: Line[];
  total: number;
  count: number;
  start: (mode: Mode, location?: string) => void;
  setLocation: (l: string) => void;
  add: (item: Pick<Item, "id" | "name" | "price_cents">, delta: number) => void;
  qty: (id: string) => number;
  fill: (lines: Line[]) => void;
  clear: () => void;
};
const CartCtx = createContext<Ctx | null>(null);

/** Panier du client (un seul à la fois). */
export function CartProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [location, setLocation] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  const add = useCallback((item: Pick<Item, "id" | "name" | "price_cents">, delta: number) => {
    setLines((ls) => {
      const cur = ls.find((l) => l.id === item.id);
      if (!cur) return delta > 0 ? [...ls, { id: item.id, name: item.name, price_cents: item.price_cents, qty: delta }] : ls;
      const q = Math.min(20, cur.qty + delta);
      return q <= 0 ? ls.filter((l) => l.id !== item.id) : ls.map((l) => (l.id === item.id ? { ...l, qty: q } : l));
    });
  }, []);

  const value = useMemo<Ctx>(() => ({
    mode, location, lines,
    total: lines.reduce((s, l) => s + l.price_cents * l.qty, 0),
    count: lines.reduce((s, l) => s + l.qty, 0),
    start: (m, l) => { if (m !== mode) setLines([]); setMode(m); if (l !== undefined) setLocation(l); },
    setLocation,
    add,
    qty: (id) => lines.find((l) => l.id === id)?.qty ?? 0,
    fill: (ls) => setLines(ls),
    clear: () => { setLines([]); },
  }), [mode, location, lines, add]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("CartProvider manquant");
  return c;
}
