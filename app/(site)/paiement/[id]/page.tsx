import { notFound, redirect } from "next/navigation";
import SumUpWidget from "@/components/SumUpWidget";
import { supabaseServer } from "@/lib/supabase/server";
import { euros } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paiement" };

export default async function Paiement({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  const { data: order } = await supabase.from("orders").select("id, number, total_cents, paid_at, sumup_checkout_id").eq("id", id).maybeSingle();
  if (!order) notFound();
  if (order.paid_at) redirect(`/commande/${order.id}`);

  return (
    <section>
      <div className="wrap stack" style={{ maxWidth: 560, gap: 20 }}>
        <p className="kick">Commande n° {order.number}</p>
        <h1 className="disp" style={{ fontSize: 48 }}>Paiement</h1>
        <p className="muted" style={{ margin: 0 }}>Montant à régler : <strong style={{ color: "var(--encre)" }}>{euros(order.total_cents)}</strong>. Paiement sécurisé par SumUp.</p>
        {order.sumup_checkout_id ? <SumUpWidget orderId={order.id} checkoutId={order.sumup_checkout_id} /> : <p className="err">Le paiement n'a pas été préparé. Recommencez la commande.</p>}
      </div>
    </section>
  );
}
