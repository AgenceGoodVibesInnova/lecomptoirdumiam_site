import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";
import { requestUser } from "@/lib/apiauth";
import { loyaltyFor } from "@/lib/loyalty";

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
  return NextResponse.json({ email: user.email, profile, settings, loyalty, canOrder: !!settings?.ordering_open || !!staff, staffPreview: !settings?.ordering_open && !!staff });
}
