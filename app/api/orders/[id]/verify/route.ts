import { NextResponse } from "next/server";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { getCheckout } from "@/lib/sumup";

/** Vérifie le paiement auprès de SumUp (jamais sur la seule parole du navigateur). */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });

  const admin = supabaseService();
  const { data: order } = await admin.from("orders").select("id, user_id, sumup_checkout_id, paid_at, status").eq("id", id).maybeSingle();
  if (!order || order.user_id !== user.id) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
  if (order.paid_at) return NextResponse.json({ status: order.status });
  if (!order.sumup_checkout_id) return NextResponse.json({ error: "Paiement absent." }, { status: 400 });

  const checkout = await getCheckout(order.sumup_checkout_id);
  if (checkout.status === "PAID") {
    await admin.from("orders").update({ status: "nouvelle", paid_at: new Date().toISOString() }).eq("id", id).is("paid_at", null);
    return NextResponse.json({ status: "nouvelle" });
  }
  return NextResponse.json({ status: order.status, sumup: checkout.status });
}
