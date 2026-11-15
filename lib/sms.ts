// Envoi de SMS transactionnels via Brevo (https://developers.brevo.com/docs/transactional-sms-endpoints).
const API = "https://api.brevo.com/v3/transactionalSMS/send";

export const smsConfigured = () => !!process.env.BREVO_API_KEY;

/** Numéro français ou international → format attendu par Brevo (indicatif sans « + », ex. 33612345678). */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (/^0[1-9]\d{8}$/.test(d)) d = "33" + d.slice(1);
  return /^\d{10,15}$/.test(d) ? d : null;
}

export async function sendSms(to: string, content: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const key = process.env.BREVO_API_KEY;
  if (!key) return { ok: false, error: "L'envoi de SMS n'est pas encore configuré (clé Brevo manquante)." };
  const recipient = normalizePhone(to);
  if (!recipient) return { ok: false, error: "Numéro de téléphone invalide." };
  const res = await fetch(API, {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: (process.env.SMS_SENDER ?? "LeMiam").slice(0, 11), recipient, content, type: "transactional", tag: "commande-prete", unicodeEnabled: true }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("Échec SMS Brevo", res.status, txt);
    return { ok: false, error: res.status === 402 ? "Crédits SMS épuisés chez Brevo." : "Le SMS n'a pas pu partir. Réessayez." };
  }
  return { ok: true };
}

/** Texte du SMS selon le mode de commande (sans code STOP : reste transactionnel). */
export function readySms(o: { number: number; mode: string; location: string | null; customer_name?: string | null }) {
  const name = o.customer_name?.split(" ")[0];
  const hello = name ? `Bonjour ${name}, ` : "Bonjour, ";
  if (o.mode === "mobilhome") return `${hello}votre commande n°${o.number} est prête : nous l'apportons à votre mobil-home${o.location ? ` (${o.location})` : ""}. Bon appétit ! Le Comptoir du Miam`;
  if (o.mode === "table") return `${hello}votre commande n°${o.number} est prête, elle arrive à votre table. Bon appétit ! Le Comptoir du Miam`;
  return `${hello}votre commande n°${o.number} est prête ! Vous pouvez venir la retirer au Comptoir du Miam. À tout de suite !`;
}
