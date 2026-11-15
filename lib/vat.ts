/** Ventilation TVA d'une liste de lignes TTC. */
export function vatBreakdown(lines: { unit_price_cents: number; quantity: number; vat_rate?: number | null }[]) {
  const byRate = new Map<number, { ttc: number; ht: number; tva: number }>();
  for (const l of lines) {
    const rate = Number(l.vat_rate ?? 10);
    const ttc = l.unit_price_cents * l.quantity;
    const ht = Math.round(ttc / (1 + rate / 100));
    const cur = byRate.get(rate) ?? { ttc: 0, ht: 0, tva: 0 };
    byRate.set(rate, { ttc: cur.ttc + ttc, ht: cur.ht + ht, tva: cur.tva + (ttc - ht) });
  }
  const rows = [...byRate.entries()].sort((a, b) => a[0] - b[0]).map(([rate, v]) => ({ rate, ...v }));
  return { rows, ht: rows.reduce((s, r) => s + r.ht, 0), tva: rows.reduce((s, r) => s + r.tva, 0), ttc: rows.reduce((s, r) => s + r.ttc, 0) };
}

export const htFromTtc = (ttc: number, rate: number) => Math.round(ttc / (1 + rate / 100));
export const pct = (n: number) => `${n.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
