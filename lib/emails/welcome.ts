const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function welcomeEmail(firstName: string | null, siteUrl: string) {
  const name = firstName ? esc(firstName) : "";
  const subject = `Bienvenue au Comptoir du Miam${firstName ? ", " + firstName : ""} !`;
  // Mise en page en tableaux : seul format lu correctement par toutes les messageries.
  const html = `<!doctype html><html lang="fr"><body style="margin:0;background:#e3d8c4;font-family:Helvetica,Arial,sans-serif;color:#272725">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e3d8c4;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#efe8db;border-radius:6px;overflow:hidden">
<tr><td align="center" style="padding:32px 40px 18px;border-bottom:1px solid #d5c9b4"><img src="${siteUrl}/logo.png" width="200" alt="Le Comptoir du Miam" style="display:block"></td></tr>
<tr><td style="padding:32px 40px 8px">
<h1 style="margin:0 0 16px;font-family:'Arial Narrow',Arial,sans-serif;font-size:36px;line-height:1.1;text-transform:uppercase">Bienvenue ${name} !</h1>
<p style="margin:0 0 14px;font-size:16px;line-height:1.6">Merci de vous être inscrit au Comptoir du Miam. Votre compte est prêt : vous pouvez maintenant commander en ligne et retrouver toutes vos commandes au même endroit.</p>
<p style="margin:0;font-size:16px;line-height:1.6">Brunch le matin, snack le midi, restaurant le soir et l'épicerie toute la journée : on s'occupe de tout, vous profitez des vacances.</p>
</td></tr>
<tr><td align="center" style="padding:24px 40px 32px"><a href="${siteUrl}/compte" style="display:inline-block;background:#272725;color:#efe8db;text-decoration:none;padding:16px 36px;border-radius:4px;font-weight:bold;font-size:18px;text-transform:uppercase;letter-spacing:1px">Je passe commande</a></td></tr>
<tr><td style="background:#272725;color:#d5c9b4;padding:24px 40px;font-size:13px;line-height:1.6">
<strong style="color:#efe8db;font-size:16px">LE COMPTOIR DU MIAM</strong><br>Brunch · Snack · Restaurant · Épicerie<br>
<span style="color:#b1a79a;font-size:12px">Vous recevez cet e-mail car vous avez créé un compte sur ${esc(siteUrl.replace(/^https?:\/\//, ""))}.</span>
</td></tr></table></td></tr></table></body></html>`;
  return { subject, html };
}

export async function sendWelcome(to: string, firstName: string | null) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const { subject, html } = welcomeEmail(firstName, site);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
  });
  return res.ok;
}
