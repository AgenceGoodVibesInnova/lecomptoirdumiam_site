import { NextResponse } from "next/server";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { getCheckout, sumupConfigured } from "@/lib/sumup";
import { sendMail } from "@/lib/mailer";
import { orderConfirmationEmail } from "@/lib/emails/templates";

/** Vérifie le paiement auprès de SumUp (jamais sur la seule parole du navigateur). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const admin = supabaseService();
  const { data: order } = await admin.from("orders").select("id, user_id, sumup_checkout_id, paid_at, status, is_demo").eq("id", id).maybeSingle();
  if (!order || order.user_id !== user.id) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  if (order.paid_at) return NextResponse.json({ status: order.status });
  if (!order.sumup_checkout_id) return NextResponse.json({ error: "Paiement absent." }, { status: 400 });

  // Paiement simulé : accepté seulement pour une commande créée en mode simulé, tant que SumUp n'est pas branché.
  const simulated = order.is_demo && order.sumup_checkout_id.startsWith("demo-") && !sumupConfigured();
  const paid = simulated || (!order.is_demo && (await getCheckout(order.sumup_checkout_id)).status === "PAID");
  if (paid) {
    const { data: updated } = await admin.from("orders").update({ status: "nouvelle", paid_at: new Date().toISOString() })
      .eq("id", id).is("paid_at", null).select("id, number, mode, location, total_cents, customer_email, is_demo, order_items(name, quantity, unit_price_cents)").maybeSingle();
    // E-mail de confirmation, envoyé une seule fois (seul l'appel qui a marqué la commande payée l'envoie)
    if (updated?.customer_email) {
      await admin.rpc("assign_invoice_number", { p_order: id });
      await sendMail({ to: updated.customer_email, ...orderConfirmationEmail(updated, updated.order_items ?? []) });
    }
    return NextResponse.json({ status: "nouvelle" });
  }
  return NextResponse.json({ status: order.status });
}
