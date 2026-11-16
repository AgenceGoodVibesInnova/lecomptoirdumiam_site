import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { requestUser } from "@/lib/apiauth";
import { loyaltyFor } from "@/lib/loyalty";
import { sumupConfigured } from "@/lib/sumup";

/** Profil, carte de fidélité et état de la commande en ligne, pour l'application. */
export async function GET(req: Request) {
  const user = await requestUser(req);
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const admin = supabaseService();
  const [{ data: profile }, { data: settings }, { data: staff }, loyalty] = await Promise.all([
    admin.from("profiles").select("first_name, last_name, phone, postal_code, on_camping, mobilhome").eq("id", user.id).maybeSingle(),
    admin.from("settings").select("ordering_open, opening_label, camping_name, hours, address, phone, ubereats_url, instagram_url").eq("id", 1).single(),
    admin.from("staff").select("role").eq("user_id", user.id).maybeSingle(),
    loyaltyFor(admin, user.id),
  ]);
  return NextResponse.json({ email: user.email, profile, settings, loyalty, // Le public ne peut commander que si la commande est ouverte ET le paiement branché ; l'équipe peut toujours tester.
    canOrder: (!!settings?.ordering_open && sumupConfigured()) || !!staff,
    notice: settings?.ordering_open && !sumupConfigured() ? "Le paiement en ligne est en cours d'installation : commandez directement au comptoir en attendant" : null, staffPreview: !settings?.ordering_open && !!staff, staffRole: staff?.role ?? null });
}

/** Suppression du compte par le client lui-même (exigée par l'App Store). Les commandes restent pour la comptabilité, sans lien au compte. */
export async function DELETE(req: Request) {
  const user = await requestUser(req);
  if (!user) return NextResponse.json({ error: "Non connecté." }, { status: 401 });
  const admin = supabaseService();
  const { data: staff } = await admin.from("staff").select("role").eq("user_id", user.id).maybeSingle();
  if (staff) return NextResponse.json({ error: "Un compte de l'équipe se retire depuis l'administration (Équipe)." }, { status: 400 });
  await admin.from("push_tokens").delete().eq("user_id", user.id);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return NextResponse.json({ error: "Suppression impossible. Contactez le restaurant." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
