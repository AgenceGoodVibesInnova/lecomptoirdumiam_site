// Envoi de SMS « commande prête », par l'un de ces deux moyens :
// 1. Votre propre téléphone Android, avec l'application gratuite SMS Gateway for Android (https://docs.sms-gate.app),
//    en mode « Cloud Server » : variables SMSGATE_USER et SMSGATE_PASS (identifiants affichés dans l'application).
// 2. Brevo (payant, https://developers.brevo.com/docs/transactional-sms-endpoints) : variable BREVO_API_KEY.
const API = "https://api.brevo.com/v3/transactionalSMS/send";
const SMSGATE_API = "https://api.sms-gate.app/3rdparty/v1/messages";

const smsGateConfigured = () => !!(process.env.SMSGATE_USER && process.env.SMSGATE_PASS);
export const smsConfigured = () => smsGateConfigured() || !!process.env.BREVO_API_KEY;

/** Numéro français ou international → format attendu par Brevo (indicatif sans « + », ex. 33612345678). */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = raw.replace(/[^\d+]/g, "");
  if (d.startsWith("+")) d = d.slice(1);
  else if (d.startsWith("00")) d = d.slice(2);
  else if (/^0[1-9]\d{8}$/.test(d)) d = "33" + d.slice(1);
  return /^\d{10,15}$/.test(d) ? d : null;
}

async function sendViaPhone(recipient: string, content: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = Buffer.from(`${process.env.SMSGATE_USER}:${process.env.SMSGATE_PASS}`).toString("base64");
  const res = await fetch(SMSGATE_API, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "content-type": "application/json" },
    body: JSON.stringify({ textMessage: { text: content }, phoneNumbers: [`+${recipient}`] }),
  });
  if (!res.ok) {
    console.error("Échec SMS (téléphone relais)", res.status, await res.text().catch(() => ""));
    return { ok: false, error: res.status === 401 ? "Identifiants du téléphone relais refusés." : "Le téléphone relais n'a pas pu envoyer le SMS. Vérifiez qu'il est allumé et connecté." };
  }
  return { ok: true };
}

export async function sendSms(to: string, content: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (smsGateConfigured()) {
    const r = normalizePhone(to);
    if (!r) return { ok: false, error: "Numéro de téléphone invalide." };
    return sendViaPhone(r, content);
  }
  const key = process.env.BREVO_API_KEY;
  if (!key) return { ok: false, error: "L'envoi de SMS n'est pas encore configuré (clé Brevo manquante)." };
  const recipient = normalizePhone(to);
  if (!recipient) return { ok: false, error: "Numéro de téléphone invalide." };
  const res = await fetch(API, {
    method: "POST",
    headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: (process.env.SMS_SENDER ?? "LeMiam").slice(0, 11), recipient, content, type: "transactional", tag: "commande-prete", unicodeEnabled: !isGsm(content) }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("Échec SMS Brevo", res.status, txt);
    return { ok: false, error: res.status === 402 ? "Crédits SMS épuisés chez Brevo." : "Le SMS n'a pas pu partir. Réessayez." };
  }
  return { ok: true };
}

// Alphabet GSM 7 bits : un SMS = 160 caractères. Hors de cet alphabet (ê, ç, °, emoji…), le SMS passe en
// Unicode (70 caractères) et compte double ou triple. Les textes ci-dessous restent dans l'alphabet GSM.
const GSM = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
export const isGsm = (t: string) => [...t].every((c) => GSM.includes(c));

/** Texte du SMS selon le mode de commande (sans code STOP : reste transactionnel ; un seul SMS de 160 caractères). */
export function readySms(o: { number: number; mode: string; location: string | null; customer_name?: string | null }) {
  const first = o.customer_name?.split(" ")[0];
  const name = first && isGsm(first) ? first : null;
  const hello = name ? `Bonjour ${name}, ` : "Bonjour, ";
  let text: string;
  if (o.mode === "mobilhome") text = `${hello}votre commande ${o.number} est en route vers votre mobil-home${o.location ? ` (${o.location})` : ""}. Bon appétit ! Le Comptoir du Miam`;
  else if (o.mode === "table") text = `${hello}votre commande ${o.number} arrive à votre table. Bon appétit ! Le Comptoir du Miam`;
  else text = `${hello}votre commande ${o.number} vous attend au Comptoir du Miam. Vous pouvez venir la retirer. Merci et à tout de suite !`;
  if (!isGsm(text) || text.length > 160) text = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "").slice(0, 160);
  return text;
}
