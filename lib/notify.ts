import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMail } from "./mailer";
import { orderReadyEmail } from "./emails/templates";
import { pushToUser } from "./push";
import { readySms, sendSms, smsConfigured } from "./sms";

type Out = { ok: true; message: string };

/**
 * Prévient le client que sa commande est prête : notification de l'application (gratuite),
 * sinon SMS si un service est branché ; e-mail en plus quand l'adresse est connue. Passe la commande en « Prête ».
 */
export async function notifyReadyCore(admin: SupabaseClient, id: string): Promise<Out> {
  const { data: o, error } = await admin.from("orders").select("id, number, mode, location, status, customer_name, customer_phone, customer_email, user_id").eq("id", id).single();
  if (error || !o) throw new Error("Commande introuvable.");
  let phone = o.customer_phone as string | null;
  let email = o.customer_email as string | null;
  if ((!phone || !email) && o.user_id) {
    const p = (await admin.from("profiles").select("phone, email").eq("id", o.user_id).single()).data;
    phone = phone ?? p?.phone ?? null;
    email = email ?? p?.email ?? null;
  }
  const sent: string[] = [];
  const problems: string[] = [];
  const pushed = o.user_id ? await pushToUser(admin, o.user_id, {
    title: `Commande n° ${o.number} prête !`,
    body: o.mode === "mobilhome" ? "Elle part vers votre mobil-home. Bon appétit !" : o.mode === "table" ? "Elle arrive à votre table. Bon appétit !" : "Vous pouvez venir la retirer au comptoir.",
    data: { orderId: o.id },
  }) : 0;
  if (pushed) sent.push("notification");
  if (!pushed && phone && smsConfigured()) {
    const r = await sendSms(phone, readySms(o));
    if (r.ok) sent.push("SMS"); else problems.push(r.error);
  }
  if (email) {
    if (await sendMail({ to: email, ...orderReadyEmail(o) })) sent.push("e-mail"); else problems.push("L'e-mail n'a pas pu partir.");
  }
  if (!sent.length) throw new Error(problems[0] ?? "Ni application, ni téléphone, ni e-mail pour ce client.");
  const patch: Record<string, unknown> = { sms_ready_sent_at: new Date().toISOString() };
  if (o.status === "nouvelle" || o.status === "en_preparation") patch.status = "prete";
  await admin.from("orders").update(patch).eq("id", id);
  return { ok: true, message: `Client prévenu par ${sent.join(" et ")} (commande n°${o.number}).${problems.length ? " " + problems[0] : ""}` };
}
