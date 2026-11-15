import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { euros, MODES, STATUTS } from "@/lib/format";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ma commande" };

export default async function Suivi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const o = data as Order;
  return (
    <section>
      <div className="wrap stack" style={{ maxWidth: 640, gap: 18 }}>
        <p className="kick">Commande n° {o.number}</p>
        <h1 className="disp" style={{ fontSize: 48 }}>{o.paid_at ? <>Merci, c'est <span className="hl">parti</span> !</> : "Commande en attente"}</h1>
        <p style={{ margin: 0 }}><span className={`badge ${o.status}`}>{STATUTS[o.status]}</span> · {MODES[o.mode].label} · {o.location}</p>
        <div className="card stack" style={{ gap: 6 }}>
          {o.order_items?.map((i) => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between" }}><span>{i.quantity} × {i.name}</span><span>{euros(i.unit_price_cents * i.quantity)}</span></div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid var(--sable-3)", paddingTop: 8 }}><span>Total</span><span>{euros(o.total_cents)}</span></div>
        </div>
        <div className="row">
          <Link href={`/commande/${o.id}`} className="btn">Actualiser le statut</Link>
          <Link href="/compte" className="btn primary">Mon espace</Link>
        </div>
      </div>
    </section>
  );
}
