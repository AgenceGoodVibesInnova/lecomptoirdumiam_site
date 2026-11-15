import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { requestStaff } from "@/lib/apiauth";
import { markPaid } from "@/lib/orders";
import { isMode } from "@/lib/format";

type Body = {
  mode?: string; location?: string; note?: string; items?: { id: string; qty: number }[];
  customer_name?: string; customer_email?: string; customer_phone?: string;
  payment?: "terminal" | "especes" | "plus_tard";
};

/** Commandes en cours (pour l'écran équipe de l'application). */
export async function GET(req: Request) {
  if (!(await requestStaff(req, "lecteur"))) return NextResponse.json({ error: "Réservé à l'équipe." }, { status: 403 });
  const since = new Date(Date.now() - 3 * 3600_000).toISOString();
  const { data } = await supabaseService().from("orders")
    .select("id, number, mode, location, note, status, total_cents, paid_at, payment_method, source, customer_name, created_at, sms_ready_sent_at, is_demo, order_items(name, quantity, unit_price_cents)")
    .or("paid_at.not.is.null,source.eq.equipe")
    .or(`status.in.(nouvelle,en_preparation,prete),and(status.eq.terminee,updated_at.gte.${since})`)
    .order("created_at");
  return NextResponse.json({ orders: data ?? [] });
}

/** Prise de commande par l'équipe, à table ou au comptoir, encaissée au terminal, en espèces ou plus tard. */
export async function POST(req: Request) {
  const staff = await requestStaff(req, "editeur");
  if (!staff) return NextResponse.json({ error: "Réservé à l'équipe (éditeur ou administrateur)." }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as Body;
  if (!b.mode || !isMode(b.mode)) return NextResponse.json({ error: "Mode de commande inconnu." }, { status: 400 });
  const wanted = (b.items ?? []).filter((i) => typeof i.id === "string" && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 50);
  if (!wanted.length) return NextResponse.json({ error: "Panier vide." }, { status: 400 });
  const location = (b.location ?? "").trim().slice(0, 60);
  if (!location) return NextResponse.json({ error: b.mode === "table" ? "Indiquez le numéro de table." : "Indiquez un nom ou un repère." }, { status: 400 });
  if (!["terminal", "especes", "plus_tard"].includes(b.payment ?? "")) return NextResponse.json({ error: "Choisissez l'encaissement." }, { status: 400 });

  const admin = supabaseService();
  const { data: menuItems } = await admin.from("menu_items").select("id, name, price_cents, vat_rate").in("id", wanted.map((w) => w.id));
  const lines = wanted.map((w) => {
    const m = menuItems?.find((x) => x.id === w.id);
    return m ? { menu_item_id: m.id, name: m.name, unit_price_cents: m.price_cents, quantity: w.qty, vat_rate: Number(m.vat_rate ?? 10) } : null;
  });
  if (lines.some((l) => !l)) return NextResponse.json({ error: "Un article n'existe plus." }, { status: 409 });
  const total = lines.reduce((s, l) => s + l!.unit_price_cents * l!.quantity, 0);

  // Client facultatif : s'il a un compte (même e-mail), la commande lui est rattachée (fidélité, notification).
  const email = (b.customer_email ?? "").trim().toLowerCase() || null;
  let user_id: string | null = null;
  let customer_name = (b.customer_name ?? "").trim().slice(0, 80) || null;
  if (email) {
    const { data: p } = await admin.from("profiles").select("id, first_name, last_name").ilike("email", email).maybeSingle();
    if (p) {
      user_id = p.id;
      customer_name = customer_name ?? ([p.first_name, p.last_name].filter(Boolean).join(" ") || null);
    }
  }
  const paid = b.payment !== "plus_tard";
  const { data: order, error } = await admin.from("orders").insert({
    user_id, mode: b.mode, location, note: (b.note ?? "").slice(0, 500) || null, total_cents: total,
    customer_name, customer_email: email, customer_phone: (b.customer_phone ?? "").trim().slice(0, 20) || null,
    source: "equipe", created_by: staff.user.id, status: "nouvelle",
    payment_method: paid ? b.payment : null,
  }).select("id, number").single();
  if (error || !order) return NextResponse.json({ error: "Commande impossible à enregistrer." }, { status: 500 });
  await admin.from("order_items").insert(lines.map((l) => ({ ...l!, order_id: order.id })));
  if (paid) await markPaid(admin, order.id);
  return NextResponse.json({ id: order.id, number: order.number });
}
