import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { sendMail } from "@/lib/mailer";
import { welcomeEmail } from "@/lib/emails/templates";

/** Liens reçus par e-mail : confirmation d'inscription, invitation, mot de passe oublié, accès direct. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const nextParam = url.searchParams.get("next");
  const next = nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/compte";
  if (token_hash && type) {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      // Première confirmation d'une inscription par e-mail : e-mail de bienvenue (une seule fois).
      const user = data.user;
      if (type === "signup" && user?.email) {
        const admin = supabaseService();
        const { data: profile } = await admin.from("profiles").select("first_name, welcome_sent_at").eq("id", user.id).maybeSingle();
        if (profile && !profile.welcome_sent_at && (await sendMail({ to: user.email, ...welcomeEmail(profile.first_name) }))) {
          await admin.from("profiles").update({ welcome_sent_at: new Date().toISOString() }).eq("id", user.id);
        }
      }
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  const back = next.startsWith("/admin") ? "/admin/connexion?lien=expire" : "/connexion?lien=expire";
  return NextResponse.redirect(new URL(back, url.origin));
}
