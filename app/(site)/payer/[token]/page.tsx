import { notFound, redirect } from "next/navigation";
import SumUpWidget from "@/components/SumUpWidget";
import DemoPayment from "@/components/DemoPayment";
import { supabaseService } from "@/lib/supabase/server";
import { euros } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paiement", robots: { index: false } };

const UUID = /^[0-9a-f-]{36}$/i;

/** Paiement par lien (utilisé par l'application mobile, sans session web). */
export default async function Payer({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!UUID.test(token)) notFound();
  const { data: order } = await supabaseService().from("orders").select("id, number, total_cents, paid_at, sumup_checkout_id").eq("pay_token", token).maybeSingle();
  if (!order) notFound();
  const done = `/payer/${token}/merci`;
  if (order.paid_at) redirect(done);
  const demo = order.sumup_checkout_id?.startsWith("demo-");

  return (
    <section>
      <div className="wrap stack" style={{ maxWidth: 560, gap: 20 }}>
        <p className="kick">Commande n° {order.number}</p>
        <h1 className="disp" style={{ fontSize: 44 }}>Paiement</h1>
        <p className="muted" style={{ margin: 0 }}>Montant à régler : <strong style={{ color: "var(--encre)" }}>{euros(order.total_cents)}</strong>.{demo ? "" : " Paiement sécurisé par SumUp."}</p>
        {!order.sumup_checkout_id ? <p className="err">Le paiement n'a pas été préparé. Recommencez la commande.</p>
          : demo ? <DemoPayment orderId={order.id} total={order.total_cents} payToken={token} doneUrl={done} />
          : <SumUpWidget orderId={order.id} checkoutId={order.sumup_checkout_id} payToken={token} doneUrl={done} />}
      </div>
    </section>
  );
}
