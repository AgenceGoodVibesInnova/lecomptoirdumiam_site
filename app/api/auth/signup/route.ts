import { NextResponse } from "next/server";
import { makeAuthLink } from "@/lib/authlinks";
import { sendMail } from "@/lib/mailer";
import { confirmSignupEmail } from "@/lib/emails/templates";

type Body = { email?: string; password?: string; phone?: string; first_name?: string; last_name?: string; postal_code?: string; on_camping?: boolean; mobilhome?: string | null; next?: string };

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Body;
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  if (!b.password || b.password.length < 8) return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  const first = String(b.first_name ?? "").trim().slice(0, 60);
  const { link, error } = await makeAuthLink("signup", email, {
    password: b.password,
    next: b.next,
    data: { first_name: first, phone: String(b.phone ?? "").trim().slice(0, 20) || null, last_name: String(b.last_name ?? "").trim().slice(0, 60), postal_code: String(b.postal_code ?? "").trim().slice(0, 10), on_camping: !!b.on_camping, mobilhome: b.on_camping ? String(b.mobilhome ?? "").slice(0, 20) : null },
  });
  if (error || !link) {
    const exists = /registered|exists/i.test(error ?? "");
    return NextResponse.json({ error: exists ? "Un compte existe déjà avec cet e-mail. Connectez-vous ou utilisez « Mot de passe oublié »." : "L'inscription n'a pas abouti. Réessayez dans un instant." }, { status: exists ? 409 : 500 });
  }
  const mail = confirmSignupEmail(first || null, link);
  const sent = await sendMail({ to: email, ...mail });
  if (!sent) return NextResponse.json({ error: "Compte créé, mais l'e-mail de confirmation n'a pas pu partir. Contactez le restaurant." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
