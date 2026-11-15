import { NextResponse } from "next/server";
import { makeAuthLink } from "@/lib/authlinks";
import { sendMail } from "@/lib/mailer";
import { resetEmail } from "@/lib/emails/templates";

export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { email?: string; next?: string };
  const email = String(b.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return NextResponse.json({ error: "Adresse e-mail invalide." }, { status: 400 });
  const next = b.next === "/admin/mot-de-passe" ? "/admin/mot-de-passe" : "/mot-de-passe";
  const { link } = await makeAuthLink("recovery", email, { next });
  if (link) await sendMail({ to: email, ...resetEmail(link) });
  // Même réponse que le compte existe ou non : on ne révèle pas qui est inscrit.
  return NextResponse.json({ ok: true });
}
