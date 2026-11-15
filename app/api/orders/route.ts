import { NextResponse } from "next/server";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { createCheckout } from "@/lib/sumup";
import { isMode } from "@/lib/format";

type Body = { mode?: string; location?: string; note?: string; items?: { id: string; qty: number }[] };

export async function POST(req: Request) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connectez-vous pour commander." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.mode || !isMode(body.mode)) return NextResponse.json({ error: "Mode de commande inconnu." }, { status: 400 });
  const wanted = (body.items ?? []).filter((i) => typeof i.id === "string" && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 20);
  if (!wanted.length) return NextResponse.json({ error: "Panier vide." }, { status: 400 });
  const location = (body.location ?? "").trim().slice(0, 60);
  if (!location) return NextResponse.json({ error: "Indiquez où vous servir." }, { status: 400 });

  const admin = supabaseService();
  const { data: settings } = await admin.from("settings").select("ordering_open").eq("id", 1).single();
  if (!settings?.ordering_open) return NextResponse.json({ error: "La commande en ligne n'est pas encore ouverte." }, { status: 403 });

  // Les prix viennent toujours de la base, jamais du navigateur.
  const { data: menuItems } = await admin
    .from("menu_items").select("id, name, price_cents, available, vat_rate").in("id", wanted.map((w) => w.id));
  const lines = wanted.map((w) => {
    const m = menuItems?.find((x) => x.id === w.id);
    return m && m.available ? { menu_item_id: m.id, name: m.name, unit_price_cents: m.price_cents, quantity: w.qty, vat_rate: Number(m.vat_rate ?? 10) } : null;
  });
  if (lines.some((l) => !l)) return NextResponse.json({ error: "Un article n'est plus disponible. Rechargez la page." }, { status: 409 });
  const total = lines.reduce((s, l) => s + l!.unit_price_cents * l!.quantity, 0);
  if (total <= 0) return NextResponse.json({ error: "Montant invalide." }, { status: 400 });

  const { data: profile } = await admin.from("profiles").select("first_name, last_name").eq("id", user.id).maybeSingle();
  const customer_name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null;
  const { data: order, error } = await admin
    .from("orders")
    .insert({ user_id: user.id, mode: body.mode, location, note: (body.note ?? "").slice(0, 500) || null, total_cents: total, customer_name, customer_email: user.email })
    .select("id, number").single();
  if (error || !order) return NextResponse.json({ error: "Commande impossible à enregistrer." }, { status: 500 });
  await admin.from("order_items").insert(lines.map((l) => ({ ...l!, order_id: order.id })));

  try {
    const checkout = await createCheckout({ reference: order.id, amountCents: total, description: `Le Comptoir du Miam · commande n° ${order.number}` });
    await admin.from("orders").update({ sumup_checkout_id: checkout.id }).eq("id", order.id);
  } catch (e) {
    await admin.from("orders").delete().eq("id", order.id);
    console.error(e);
    return NextResponse.json({ error: "Le paiement n'a pas pu être préparé. Réessayez dans un instant." }, { status: 502 });
  }
  return NextResponse.json({ id: order.id });
}
