import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { requestStaff } from "@/lib/apiauth";
import { markPaid } from "@/lib/orders";

const STATUTS = ["nouvelle", "en_preparation", "prete", "terminee", "annulee"];

/** Change le statut d'une commande, ou l'encaisse (terminal / espèces). */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requestStaff(req, "editeur"))) return NextResponse.json({ error: "Réservé à l'équipe (éditeur ou administrateur)." }, { status: 403 });
  const { id } = await params;
  const b = (await req.json().catch(() => ({}))) as { status?: string; payment?: string };
  const admin = supabaseService();
  if (b.payment) {
    if (!["terminal", "especes"].includes(b.payment)) return NextResponse.json({ error: "Encaissement inconnu." }, { status: 400 });
    const { data: o } = await admin.from("orders").select("status, paid_at").eq("id", id).single();
    if (!o) return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    if (o.paid_at) return NextResponse.json({ error: "Commande déjà encaissée." }, { status: 409 });
    await admin.from("orders").update({ payment_method: b.payment }).eq("id", id);
    await markPaid(admin, id);
    // markPaid repasse en « nouvelle » : on garde l'avancement de la cuisine.
    if (o.status !== "nouvelle") await admin.from("orders").update({ status: o.status }).eq("id", id);
    return NextResponse.json({ ok: true });
  }
  if (!b.status || !STATUTS.includes(b.status)) return NextResponse.json({ error: "Statut inconnu." }, { status: 400 });
  const { error } = await admin.from("orders").update({ status: b.status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) return NextResponse.json({ error: "Mise à jour impossible." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
