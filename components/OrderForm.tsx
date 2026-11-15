"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { euros, MODES } from "@/lib/format";
import type { Mode } from "@/lib/types";

type Item = { id: string; name: string; description: string | null; price_cents: number };
type Cat = { id: string; name: string; items: Item[] };

export default function OrderForm({ mode, menu, defaultLocation, defaultPhone }: { mode: Mode; menu: Cat[]; defaultLocation: string; defaultPhone: string }) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [location, setLocation] = useState(defaultLocation);
  const [note, setNote] = useState("");
  const [phone, setPhone] = useState(defaultPhone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const items = useMemo(() => menu.flatMap((c) => c.items), [menu]);
  const lines = items.filter((i) => cart[i.id]).map((i) => ({ ...i, qty: cart[i.id] }));
  const total = lines.reduce((s, l) => s + l.price_cents * l.qty, 0);
  const add = (id: string, d: number) =>
    setCart((c) => {
      const n = Math.max(0, Math.min(20, (c[id] ?? 0) + d));
      const next = { ...c };
      if (n) next[id] = n; else delete next[id];
      return next;
    });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!lines.length) return setError("Ajoutez au moins un article.");
    if (!location.trim()) return setError(`Indiquez : ${MODES[mode].lieu.toLowerCase()}.`);
    setBusy(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, location, note, phone, items: lines.map((l) => ({ id: l.id, qty: l.qty })) }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(data.error ?? "La commande n'a pas pu être créée. Réessayez.");
    router.push(`/paiement/${data.id}`);
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", gap: 24, alignItems: "start" }} className="order-grid">
      <style>{`@media (max-width: 820px){.order-grid{grid-template-columns:minmax(0,1fr)!important}}`}</style>
      <div className="stack" style={{ gap: 28 }}>
        {menu.filter((c) => c.items.length).map((c) => (
          <div key={c.id} className="stack" style={{ gap: 10 }}>
            <h2 className="disp" style={{ fontSize: 28, borderBottom: "3px solid var(--encre)", paddingBottom: 6 }}>{c.name}</h2>
            {c.items.map((i) => (
              <div key={i.id} className="card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{i.name}</div>
                  {i.description ? <div className="muted" style={{ fontSize: 14 }}>{i.description}</div> : null}
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{euros(i.price_cents)}</div>
                </div>
                {cart[i.id] ? (
                  <>
                    <button type="button" className="btn small" onClick={() => add(i.id, -1)} aria-label={`Retirer un ${i.name}`}>−</button>
                    <span className="disp" style={{ fontSize: 20, minWidth: 20, textAlign: "center" }}>{cart[i.id]}</span>
                  </>
                ) : null}
                <button type="button" className="btn primary small" onClick={() => add(i.id, 1)} aria-label={`Ajouter ${i.name}`}>+</button>
              </div>
            ))}
          </div>
        ))}
        {!items.length ? <p className="muted">Aucun article disponible pour le moment.</p> : null}
      </div>

      <aside className="card stack" style={{ position: "sticky", top: 84, gap: 14 }}>
        <h2 className="disp" style={{ fontSize: 24 }}>Ma commande</h2>
        {lines.length ? (
          <div className="stack" style={{ gap: 6, fontSize: 15 }}>
            {lines.map((l) => (
              <div key={l.id} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <span>{l.qty} × {l.name}</span><span>{euros(l.price_cents * l.qty)}</span>
              </div>
            ))}
          </div>
        ) : <p className="muted" style={{ margin: 0 }}>Votre panier est vide.</p>}
        <div className="field">
          <label className="lbl" htmlFor="lieu">{MODES[mode].lieu}</label>
          <input id="lieu" className="in" value={location} onChange={(e) => setLocation(e.target.value)} placeholder={MODES[mode].aide} inputMode={mode === "table" ? "numeric" : undefined} />
          {mode === "table" ? <span className="muted" style={{ fontSize: 13 }}>Changé de table ? Modifiez simplement le numéro.</span> : null}
        </div>
        <div className="field">
          <label className="lbl" htmlFor="phone">Téléphone mobile</label>
          <input id="phone" className="in" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Pour être prévenu par SMS" />
        </div>
        <div className="field">
          <label className="lbl" htmlFor="note">Remarque (allergies, précisions)</label>
          <textarea id="note" className="in" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 19 }}><span>Total</span><span>{euros(total)}</span></div>
        {error ? <p className="err" role="alert">{error}</p> : null}
        <button className="btn primary" disabled={busy}>{busy ? "Un instant…" : "Payer ma commande"}</button>
      </aside>
    </form>
  );
}
