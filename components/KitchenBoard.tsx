"use client";
import { useCallback, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { notifyReady, setOrderStatus } from "@/app/admin/actions";
import { Icon, useToast } from "@/components/admin/ui";
import { MODES } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

type Col = { status: OrderStatus; title: string; next?: [OrderStatus, string]; back?: [OrderStatus, string]; accent: string };
const COLS: Col[] = [
  { status: "nouvelle", title: "Nouvelles", next: ["en_preparation", "Lancer"], accent: "#dfdf3e" },
  { status: "en_preparation", title: "En préparation", next: ["prete", "Prête"], back: ["nouvelle", "Remettre en nouvelles"], accent: "#7aa0d8" },
  { status: "prete", title: "Prêtes", next: ["terminee", "Servie / livrée"], back: ["en_preparation", "Remettre en préparation"], accent: "#86c27c" },
  { status: "annulee", title: "Annulées (24 h)", back: ["nouvelle", "Rétablir"], accent: "#d98b77" },
];

export default function KitchenBoard({ canEdit }: { canEdit: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pending, start] = useTransition();
  const [live, setLive] = useState(false);
  const [, tick] = useState(0);
  const toast = useToast();

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 864e5).toISOString();
    const { data } = await supabaseBrowser()
      .from("orders").select("*, order_items(*)")
      .not("paid_at", "is", null)
      .or(`status.in.(nouvelle,en_preparation,prete),and(status.eq.annulee,updated_at.gte.${since})`)
      .order("created_at");
    setOrders((data ?? []) as Order[]);
  }, []);

  useEffect(() => {
    load();
    const sb = supabaseBrowser();
    const ch = sb.channel("cuisine")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load())
      .subscribe((s) => setLive(s === "SUBSCRIBED"));
    const t = setInterval(() => { tick((n) => n + 1); }, 30000);
    const r = setInterval(load, 60000);
    return () => { clearInterval(t); clearInterval(r); sb.removeChannel(ch); };
  }, [load]);

  const move = (o: Order, to: OrderStatus) => start(async () => {
    setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status: to } : x)));
    const r = await setOrderStatus(o.id, to);
    if (!r.ok) toast.show(r);
    await load();
  });
  const notify = (o: Order) => start(async () => {
    const r = await notifyReady(o.id);
    toast.show(r);
    await load();
  });
  const minutes = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <span className="a-muted" style={{ fontSize: 12 }}>{live ? "● Connecté en direct · les nouvelles commandes apparaissent seules" : "○ Connexion…"}</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, alignItems: "start" }}>
        {COLS.map((c) => {
          const col = orders.filter((o) => o.status === c.status);
          return (
            <section key={c.status} style={{ background: c.status === "annulee" ? "transparent" : "#efebe4", borderRadius: 10, padding: 10, display: "flex", flexDirection: "column", gap: 8, border: c.status === "annulee" ? "1px dashed #d9d2c5" : "none" }}>
              <h2 style={{ margin: "2px 4px 4px", fontSize: 13, textTransform: "uppercase", letterSpacing: ".08em", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 8, height: 8, borderRadius: "50%", background: c.accent }} />{c.title}</span>
                <span className="a-muted">{col.length}</span>
              </h2>
              {col.map((o) => {
                const late = c.status !== "annulee" && minutes(o.created_at) >= 20;
                return (
                  <article key={o.id} className="a-card" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6, borderLeft: `4px solid ${c.accent}`, opacity: c.status === "annulee" ? 0.75 : 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                      <Link href={`/admin/commandes/${o.id}`} style={{ fontFamily: "var(--display)", fontSize: 20, fontWeight: 700, color: "inherit", textDecoration: "none" }}>#{o.number}</Link>{o.is_demo ? <span className="a-pill nouvelle" style={{ marginLeft: 6 }}>Essai</span> : null}
                      <span style={{ fontSize: 12, fontWeight: late ? 700 : 400, color: late ? "var(--rouge)" : "#8a8478" }}>{minutes(o.created_at)} min</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{MODES[o.mode].label} · {o.location}{o.customer_name ? <span className="a-muted" style={{ fontWeight: 400 }}> · {o.customer_name}</span> : null}</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 14 }}>{o.order_items?.map((i) => <li key={i.id}><strong>{i.quantity} ×</strong> {i.name}</li>)}</ul>
                    {o.note ? <p className="a-flash err" style={{ padding: "5px 8px", fontWeight: 600 }}>⚠ {o.note}</p> : null}
                    {c.status === "prete" ? (
                      <p style={{ margin: 0, fontSize: 12, color: o.sms_ready_sent_at ? "#2f6b2a" : "#8a8478" }}>
                        {o.sms_ready_sent_at ? `✓ Client prévenu à ${new Date(o.sms_ready_sent_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}` : o.customer_phone ? `Tél. ${o.customer_phone}` : "Pas de téléphone : avis par e-mail"}
                      </p>
                    ) : null}
                    {canEdit ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 2 }}>
                        {c.status === "prete" ? (
                          <button className="a-btn sm primary" disabled={pending} onClick={() => notify(o)} title="Envoie « votre commande est prête » au client">
                            {o.sms_ready_sent_at ? "Renvoyer l'avis" : "Prévenir le client"}
                          </button>
                        ) : null}
                        {c.next ? <button className={`a-btn sm${c.status === "prete" ? "" : " primary"}`} disabled={pending} onClick={() => move(o, c.next![0])}>{c.next[1]} {Icon.next}</button> : null}
                        {c.back ? <button className="a-btn sm" disabled={pending} onClick={() => move(o, c.back![0])}>{Icon.back} {c.back[1]}</button> : null}
                        {c.status !== "annulee" ? <button className="a-btn sm danger" disabled={pending} onClick={() => { if (confirm(`Annuler la commande #${o.number} ?`)) move(o, "annulee"); }}>Annuler</button> : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
              {!col.length ? <p className="a-muted" style={{ margin: "4px 4px 8px", fontSize: 13 }}>Rien pour l'instant.</p> : null}
            </section>
          );
        })}
      </div>
      {toast.node}
    </div>
  );
}
