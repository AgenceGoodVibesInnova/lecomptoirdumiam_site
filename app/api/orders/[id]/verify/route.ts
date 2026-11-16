import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { requestUser } from "@/lib/apiauth";
import { getCheckout, sumupConfigured } from "@/lib/sumup";
import { markPaid } from "@/lib/orders";

/**
 * Vérifie le paiement auprès de SumUp (jamais sur la seule parole du navigateur).
 * Accès : le client connecté propriétaire de la commande, ou le lien de paiement (?k=…) utilisé par l'application.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const k = new URL(req.url).searchParams.get("k");
  const admin = supabaseService();
  const { data: order } = await admin.from("orders").select("id, user_id, sumup_checkout_id, paid_at, status, is_demo, pay_token").eq("id", id).maybeSingle();
  if (!order) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  if (k) {
    if (k !== order.pay_token) return NextResponse.json({ error: "Lien de paiement invalide." }, { status: 403 });
  } else {
    const user = await requestUser(req);
    if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
    if (order.user_id !== user.id) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  }
  if (order.paid_at) return NextResponse.json({ status: order.status });
  if (!order.sumup_checkout_id) return NextResponse.json({ error: "Paiement absent." }, { status: 400 });

  // Paiement simulé : accepté seulement pour une commande créée en mode simulé, tant que SumUp n'est pas branché.
  const simulated = order.is_demo && order.sumup_checkout_id.startsWith("demo-") && !sumupConfigured();
  let paid = simulated;
  if (!simulated && !order.is_demo) {
    try {
      paid = (await getCheckout(order.sumup_checkout_id)).status === "PAID";
    } catch (e) {
      console.error(e);
      return NextResponse.json({ error: "Vérification du paiement impossible pour le moment. Réessayez dans un instant." }, { status: 502 });
    }
  }
  if (paid) {
    await markPaid(admin, id);
    return NextResponse.json({ status: "nouvelle" });
  }
  return NextResponse.json({ status: order.status });
}
