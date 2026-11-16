import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { requestUser } from "@/lib/apiauth";
import { loyaltyFor } from "@/lib/loyalty";
import { markPaid } from "@/lib/orders";
import { createCheckout, sumupConfigured } from "@/lib/sumup";
import { isMode } from "@/lib/format";

type Body = { mode?: string; location?: string; note?: string; phone?: string; use_reward?: boolean; items?: { id: string; qty: number }[] };

export async function POST(req: Request) {
  const user = await requestUser(req);
  if (!user) return NextResponse.json({ error: "Connectez-vous pour commander." }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as Body;
  if (!body.mode || !isMode(body.mode)) return NextResponse.json({ error: "Mode de commande inconnu." }, { status: 400 });
  const wanted = (body.items ?? []).filter((i) => typeof i.id === "string" && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 20);
  if (!wanted.length) return NextResponse.json({ error: "Panier vide." }, { status: 400 });
  const location = (body.location ?? "").trim().slice(0, 60);
  if (!location) return NextResponse.json({ error: "Indiquez où vous servir." }, { status: 400 });

  const admin = supabaseService();
  const { data: settings } = await admin.from("settings").select("ordering_open").eq("id", 1).single();
  const { data: staff } = await admin.from("staff").select("role").eq("user_id", user.id).maybeSingle();
  if (!settings?.ordering_open && !staff) return NextResponse.json({ error: "La commande en ligne n'est pas encore ouverte." }, { status: 403 });
  // Sans SumUp, seul le paiement simulé est possible, et uniquement pour l'équipe (tests).
  const demo = !sumupConfigured();
  if (demo && !staff) return NextResponse.json({ error: "Le paiement en ligne n'est pas encore configuré. Commandez directement au comptoir." }, { status: 503 });

  // Les prix viennent toujours de la base, jamais du navigateur.
  const { data: menuItems } = await admin
    .from("menu_items").select("id, name, price_cents, available, vat_rate").in("id", wanted.map((w) => w.id));
  const lines = wanted.map((w) => {
    const m = menuItems?.find((x) => x.id === w.id);
    return m && m.available ? { menu_item_id: m.id, name: m.name, unit_price_cents: m.price_cents, quantity: w.qty, vat_rate: Number(m.vat_rate ?? 10) } : null;
  });
  if (lines.some((l) => !l)) return NextResponse.json({ error: "Un article n'est plus disponible. Rechargez la page." }, { status: 409 });
  const subtotal = lines.reduce((s, l) => s + l!.unit_price_cents * l!.quantity, 0);
  if (subtotal <= 0) return NextResponse.json({ error: "Montant invalide." }, { status: 400 });
  // Récompense fidélité : ligne de remise, plafonnée au montant de la commande.
  let reward: { menu_item_id: null; name: string; unit_price_cents: number; quantity: number; vat_rate: number } | null = null;
  if (body.use_reward) {
    const l = await loyaltyFor(admin, user.id);
    if (!l.enabled || l.available < 1) return NextResponse.json({ error: "Pas de récompense fidélité disponible." }, { status: 400 });
    const off = Math.min(l.rewardCents, subtotal);
    if (off > 0) reward = { menu_item_id: null, name: `Fidélité · ${l.rewardLabel}`, unit_price_cents: -off, quantity: 1, vat_rate: lines[0]!.vat_rate };
  }
  const total = subtotal + (reward?.unit_price_cents ?? 0);

  const { data: profile } = await admin.from("profiles").select("first_name, last_name, phone").eq("id", user.id).maybeSingle();
  // Le téléphone saisi à la commande est gardé dans le profil s'il n'y en avait pas.
  if (body.phone && !profile?.phone) await admin.from("profiles").update({ phone: body.phone.trim().slice(0, 20) }).eq("id", user.id);
  const customer_name = [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || null;
  const { data: order, error } = await admin
    .from("orders")
    .insert({ user_id: user.id, mode: body.mode, location, note: (body.note ?? "").slice(0, 500) || null, total_cents: total, customer_name, customer_email: user.email, customer_phone: (body.phone ?? "").trim().slice(0, 20) || null, is_demo: demo, reward_used: !!reward })
    .select("id, number, pay_token").single();
  if (error || !order) return NextResponse.json({ error: "Commande impossible à enregistrer." }, { status: 500 });
  await admin.from("order_items").insert([...lines, ...(reward ? [reward] : [])].map((l) => ({ ...l!, order_id: order.id })));
  const result = { id: order.id, number: order.number, pay_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin}/payer/${order.pay_token}` };

  // Entièrement payée par la récompense : rien à encaisser.
  if (total === 0) {
    await admin.from("orders").update({ sumup_checkout_id: `free-${order.id}` }).eq("id", order.id);
    await markPaid(admin, order.id);
    return NextResponse.json({ ...result, paid: true });
  }
  if (demo) {
    await admin.from("orders").update({ sumup_checkout_id: `demo-${order.id}` }).eq("id", order.id);
    return NextResponse.json(result);
  }
  try {
    const checkout = await createCheckout({ reference: order.id, amountCents: total, description: `Le Comptoir du Miam · commande n° ${order.number}` });
    await admin.from("orders").update({ sumup_checkout_id: checkout.id }).eq("id", order.id);
  } catch (e) {
    await admin.from("orders").delete().eq("id", order.id);
    console.error(e);
    return NextResponse.json({ error: "Le paiement n'a pas pu être préparé. Réessayez dans un instant." }, { status: 502 });
  }
  return NextResponse.json(result);
}
