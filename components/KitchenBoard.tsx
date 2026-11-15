"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { setOrderStatus } from "@/app/admin/actions";
import { MODES } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

const COLS: { status: OrderStatus; title: string; next?: OrderStatus; action?: string }[] = [
  { status: "nouvelle", title: "Nouvelles", next: "en_preparation", action: "Lancer" },
  { status: "en_preparation", title: "En préparation", next: "prete", action: "Prête" },
  { status: "prete", title: "Prêtes", next: "terminee", action: "Servie / livrée" },
];

export default function KitchenBoard({ canEdit }: { canEdit: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pending, start] = useTransition();
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabaseBrowser()
      .from("orders").select("*, order_items(*)")
      .in("status", ["nouvelle", "en_preparation", "prete"]).not("paid_at", "is", null)
      .order("created_at");
    setOrders((data ?? []) as Order[]);
  }, []);

  useEffect(() => {
    load();
    const sb = supabaseBrowser();
    const ch = sb.channel("cuisine")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe((s) => setLive(s === "SUBSCRIBED"));
    const t = setInterval(load, 60000);
    return () => { clearInterval(t); sb.removeChannel(ch); };
  }, [load]);

  const minutes = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

  return (
    <div className="stack" style={{ gap: 14 }}>
      <span className="muted" style={{ fontSize: 14 }}>{live ? "● Connecté en direct" : "○ Connexion…"}</span>
      <div className="grid3" style={{ alignItems: "start" }}>
        {COLS.map((c) => {
          const col = orders.filter((o) => o.status === c.status);
          return (
            <div key={c.status} className="stack" style={{ gap: 10 }}>
              <h2 className="disp" style={{ fontSize: 22, borderBottom: "3px solid var(--encre)", paddingBottom: 6 }}>{c.title} · {col.length}</h2>
              {col.map((o) => (
                <article key={o.id} className="card stack" style={{ gap: 8, borderLeft: c.status === "nouvelle" ? "8px solid var(--eclair)" : undefined }}>
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <strong className="disp" style={{ fontSize: 24 }}>N° {o.number}</strong>
                    <span className="muted" style={{ fontSize: 14 }}>il y a {minutes(o.created_at)} min</span>
                  </div>
                  <div style={{ fontWeight: 600 }}>{MODES[o.mode].label} · {o.location}</div>
                  <ul style={{ margin: 0, paddingLeft: 18 }}>{o.order_items?.map((i) => <li key={i.id}><strong>{i.quantity} ×</strong> {i.name}</li>)}</ul>
                  {o.note ? <p className="err" style={{ fontWeight: 600 }}>⚠ {o.note}</p> : null}
                  {canEdit && c.next ? (
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn primary small" disabled={pending} onClick={() => start(async () => { await setOrderStatus(o.id, c.next!); await load(); })}>{c.action}</button>
                      {c.status === "nouvelle" ? <button className="btn small" disabled={pending} onClick={() => start(async () => { await setOrderStatus(o.id, "annulee"); await load(); })}>Annuler</button> : null}
                    </div>
                  ) : null}
                </article>
              ))}
              {!col.length ? <p className="muted" style={{ margin: 0 }}>Rien pour l'instant.</p> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
