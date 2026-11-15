// Gabarit commun des e-mails du Comptoir du Miam.
// Mise en page en tableaux et styles en ligne : seul format lu correctement par Gmail, Outlook, Apple Mail.

export const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lecomptoirdumiam.fr").replace(/\/$/, "");

type Button = { label: string; url: string };

const C = { sable: "#efe8db", sable2: "#e3d8c4", sable3: "#d5c9b4", encre: "#272725", encre2: "#4b4742", eclair: "#dfdf3e" };
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";
const DISPLAY = "'Arial Narrow','Helvetica Neue',Arial,sans-serif";

function button(b: Button, primary: boolean) {
  const bg = primary ? C.encre : C.sable;
  const fg = primary ? C.sable : C.encre;
  return `<a href="${esc(b.url)}" style="display:inline-block;background:${bg};color:${fg};border:2px solid ${C.encre};text-decoration:none;padding:13px 26px;border-radius:4px;font-family:${DISPLAY};font-weight:bold;font-size:15px;letter-spacing:1px;text-transform:uppercase;margin:4px 4px">${esc(b.label)}</a>`;
}

export function renderEmail(o: {
  preheader: string;
  kicker?: string;
  title: string;
  paragraphs: string[]; // déjà échappés
  body?: string; // HTML additionnel (tableau de commande…)
  primary?: Button;
  secondary?: Button;
  note?: string; // petite ligne sous les boutons, déjà échappée
}) {
  const site = siteUrl();
  const back: Button = { label: "Retour au site", url: site };
  const second = o.secondary ?? (o.primary && o.primary.url !== site ? back : undefined);
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(o.title)}</title></head>
<body style="margin:0;padding:0;background:${C.sable2}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(o.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.sable2}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${C.sable};border-radius:8px;overflow:hidden">
  <tr><td align="center" style="padding:30px 32px 22px;border-bottom:1px solid ${C.sable3}">
    <a href="${site}"><img src="${site}/logo.png" width="170" alt="Le Comptoir du Miam" style="display:block;width:170px;max-width:60%;height:auto;border:0"></a>
  </td></tr>
  <tr><td style="padding:30px 36px 6px;font-family:${FONT};color:${C.encre}">
    ${o.kicker ? `<p style="margin:0 0 8px;font-family:${DISPLAY};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6b6a22;font-weight:bold">${esc(o.kicker)}</p>` : ""}
    <h1 style="margin:0 0 16px;font-family:${DISPLAY};font-size:30px;line-height:1.1;text-transform:uppercase;color:${C.encre}">${esc(o.title)}</h1>
    ${o.paragraphs.map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${C.encre2}">${p}</p>`).join("")}
  </td></tr>
  ${o.body ? `<tr><td style="padding:6px 36px 6px;font-family:${FONT}">${o.body}</td></tr>` : ""}
  ${o.primary || second ? `<tr><td align="center" style="padding:18px 30px 8px">${o.primary ? button(o.primary, true) : ""}${second ? button(second, !o.primary) : ""}</td></tr>` : ""}
  ${o.note ? `<tr><td align="center" style="padding:4px 36px 0;font-family:${FONT};font-size:12px;color:${C.encre2}">${o.note}</td></tr>` : ""}
  <tr><td style="padding:26px 0 0"></td></tr>
  <tr><td style="background:${C.encre};padding:22px 36px;font-family:${FONT};font-size:12px;line-height:1.6;color:${C.sable3}">
    <span style="font-family:${DISPLAY};font-size:15px;font-weight:bold;letter-spacing:1px;color:${C.sable}">LE COMPTOIR DU MIAM</span>
    <span style="color:${C.eclair}">&nbsp;⚡</span><br>
    Brunch · Snack · Restaurant · Épicerie<br>
    <a href="${site}" style="color:${C.sable3}">${esc(site.replace(/^https?:\/\//, ""))}</a>
  </td></tr>
</table>
</td></tr></table></body></html>`;
  const text = [o.title, "", ...o.paragraphs.map((p) => p.replace(/<[^>]+>/g, "")), "", o.primary ? `${o.primary.label} : ${o.primary.url}` : "", `Le Comptoir du Miam — ${site}`].join("\n");
  return { html, text };
}

const euros = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

/** Tableau récapitulatif d'une commande, pour les e-mails. */
export function orderTable(items: { name: string; quantity: number; unit_price_cents: number }[], total: number) {
  const rows = items.map((i) => `<tr>
    <td style="padding:9px 0;border-bottom:1px solid ${C.sable3};font-size:14px;color:${C.encre}">${i.quantity} × ${esc(i.name)}</td>
    <td align="right" style="padding:9px 0;border-bottom:1px solid ${C.sable3};font-size:14px;color:${C.encre};white-space:nowrap">${euros(i.unit_price_cents * i.quantity)}</td></tr>`).join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf8f2;border:1px solid ${C.sable3};border-radius:6px;padding:6px 16px">
    ${rows}
    <tr><td style="padding:12px 0 6px;font-size:15px;font-weight:bold;color:${C.encre}">Total TTC</td>
    <td align="right" style="padding:12px 0 6px;font-size:15px;font-weight:bold;color:${C.encre}">${euros(total)}</td></tr></table>`;
}
