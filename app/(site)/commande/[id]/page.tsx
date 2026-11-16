import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AutoRefresh from "@/components/AutoRefresh";
import { supabaseServer } from "@/lib/supabase/server";
import { euros, MODES, STATUTS } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ma commande", robots: { index: false } };

const STEPS: OrderStatus[] = ["nouvelle", "en_preparation", "prete", "terminee"];

export default async function Suivi({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(`/commande/${id}`)}`);
  const { data } = await supabase.from("orders").select("*, order_items(*)").eq("id", id).maybeSingle();
  if (!data) notFound();
  const o = data as Order;
  const step = STEPS.indexOf(o.status);
  const ready = o.mode === "mobilhome" ? "Elle part vers votre mobil-home." : o.mode === "table" ? "Elle arrive à votre table." : "Vous pouvez venir la retirer au comptoir.";
  const title = !o.paid_at ? "Commande en attente" : o.status === "prete" ? "C'est prêt !" : o.status === "terminee" ? "Bon appétit !" : o.status === "annulee" ? "Commande annulée" : null;
  const live = !!o.paid_at && ["nouvelle", "en_preparation", "prete"].includes(o.status);

  return (
    <section>
      {live ? <AutoRefresh seconds={15} /> : null}
      <div className="wrap stack" style={{ maxWidth: 640, gap: 18 }}>
        <p className="kick">Commande n° {o.number}</p>
        <h1 className="disp" style={{ fontSize: "clamp(36px, 7vw, 48px)" }}>{title ?? <>Merci, c'est <span className="hl">parti</span> !</>}</h1>
        <p style={{ margin: 0 }}>{MODES[o.mode].label}{o.location ? ` · ${o.location}` : ""}</p>
        {o.paid_at && o.status !== "annulee" ? (
          <ol className="card" aria-label={`Statut : ${STATUTS[o.status]}`} style={{ listStyle: "none", margin: 0, display: "grid", gap: 12 }}>
            {STEPS.map((s, i) => (
              <li key={s} style={{ display: "flex", alignItems: "center", gap: 12, color: i <= step ? "var(--encre)" : "var(--encre-2)", opacity: i <= step ? 1 : 0.6 }}>
                <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid var(--encre)", flex: "none", background: i < step ? "var(--encre)" : i === step ? "var(--eclair)" : "transparent" }} />
                <span style={{ fontWeight: i === step ? 700 : 400 }}>{STATUTS[s]}{i === step && s === "prete" ? ` · ${ready}` : ""}</span>
              </li>
            ))}
          </ol>
        ) : null}
        {live ? <p className="muted" style={{ margin: 0, fontSize: 14 }}>Cette page se met à jour toute seule.</p> : null}
        <div className="card stack" style={{ gap: 6 }}>
          {o.order_items?.map((i) => (
            <div key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><span>{i.quantity} × {i.name}</span><span>{euros(i.unit_price_cents * i.quantity)}</span></div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, borderTop: "1px solid var(--sable-3)", paddingTop: 8 }}><span>Total</span><span>{euros(o.total_cents)}</span></div>
        </div>
        <div className="row">
          {o.paid_at ? <Link href={`/facture/${o.id}`} className="btn">Ma facture</Link> : <Link href={`/paiement/${o.id}`} className="btn">Payer la commande</Link>}
          <Link href="/compte" className="btn primary">Mon espace</Link>
        </div>
      </div>
    </section>
  );
}
