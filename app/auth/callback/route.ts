import { NextResponse } from "next/server";
import { supabaseServer, supabaseService } from "@/lib/supabase/server";
import { sendMail } from "@/lib/mailer";
import { welcomeEmail } from "@/lib/emails/templates";

/** Retour après connexion Google / Facebook : e-mail de bienvenue à la première connexion. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const suite = url.searchParams.get("suite");
  const next = suite && suite.startsWith("/") && !suite.startsWith("//") ? suite : "/compte";
  if (code) {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    const user = data.user;
    if (user?.email) {
      const admin = supabaseService();
      const { data: profile } = await admin.from("profiles").select("first_name, welcome_sent_at").eq("id", user.id).maybeSingle();
      if (profile && !profile.welcome_sent_at) {
        const sent = await sendMail({ to: user.email, ...welcomeEmail(profile.first_name) });
        if (sent) await admin.from("profiles").update({ welcome_sent_at: new Date().toISOString() }).eq("id", user.id);
      }
    }
  }
  return NextResponse.redirect(new URL(next, url.origin));
}
