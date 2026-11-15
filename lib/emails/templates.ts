import { esc, orderTable, renderEmail, siteUrl } from "./layout";

const MODE: Record<string, string> = { mobilhome: "livrée à votre mobil-home", emporter: "à emporter au comptoir", table: "servie à votre table" };

export function confirmSignupEmail(firstName: string | null, confirmUrl: string) {
  return {
    subject: "Confirmez votre inscription au Comptoir du Miam",
    ...renderEmail({
      preheader: "Un clic pour activer votre compte et commander en ligne.",
      kicker: "Bienvenue",
      title: `Bienvenue${firstName ? " " + firstName : ""} !`,
      paragraphs: [
        "Merci de vous être inscrit au Comptoir du Miam. Il ne reste qu'une étape : confirmer votre adresse e-mail.",
        "Ensuite, vous pourrez commander en ligne (au mobil-home, à emporter ou à table) et retrouver toutes vos commandes et factures dans votre espace.",
      ],
      primary: { label: "Activer mon compte", url: confirmUrl },
      note: "Vous n'êtes pas à l'origine de cette inscription ? Ignorez simplement cet e-mail.",
    }),
  };
}

export function welcomeEmail(firstName: string | null) {
  const site = siteUrl();
  return {
    subject: `Bienvenue au Comptoir du Miam${firstName ? ", " + firstName : ""} !`,
    ...renderEmail({
      preheader: "Votre compte est prêt : première commande en deux clics.",
      kicker: "Compte activé",
      title: `Bienvenue${firstName ? " " + firstName : ""} !`,
      paragraphs: [
        "Votre compte est prêt. Vous pouvez maintenant commander en ligne et retrouver toutes vos commandes au même endroit.",
        "Brunch le matin, snack le midi, restaurant le soir et l'épicerie toute la journée : on s'occupe de tout, vous profitez des vacances.",
      ],
      primary: { label: "Je passe commande", url: `${site}/commander` },
      secondary: { label: "Mon espace", url: `${site}/compte` },
    }),
  };
}

export function orderConfirmationEmail(o: { id: string; number: number; mode: string; location: string | null; total_cents: number; customer_name?: string | null; is_demo?: boolean }, items: { name: string; quantity: number; unit_price_cents: number }[]) {
  const site = siteUrl();
  return {
    subject: `${o.is_demo ? "[Essai] " : ""}Commande n° ${o.number} confirmée · Le Comptoir du Miam`,
    ...renderEmail({
      preheader: `Merci ! Votre commande n° ${o.number} est en préparation.`,
      kicker: `Commande n° ${o.number}`,
      title: "Merci, c'est parti !",
      paragraphs: [
        o.is_demo
          ? `Commande d'essai : le paiement a été simulé, rien n'a été débité. Votre commande est ${esc(MODE[o.mode] ?? "")}${o.location ? ` (${esc(o.location)})` : ""}.`
          : `Votre paiement est bien reçu. Votre commande est ${esc(MODE[o.mode] ?? "")}${o.location ? ` (${esc(o.location)})` : ""}.`,
        "Vous pouvez suivre son avancement et télécharger votre facture à tout moment.",
      ],
      body: orderTable(items, o.total_cents),
      primary: { label: "Voir ma facture", url: `${site}/facture/${o.id}` },
      secondary: { label: "Suivre ma commande", url: `${site}/commande/${o.id}` },
    }),
  };
}

export function invoiceEmail(o: { id: string; number: number; invoice_number: string; total_cents: number }, items: { name: string; quantity: number; unit_price_cents: number }[]) {
  const site = siteUrl();
  return {
    subject: `Votre facture ${o.invoice_number} · Le Comptoir du Miam`,
    ...renderEmail({
      preheader: `Facture ${o.invoice_number} pour votre commande n° ${o.number}.`,
      kicker: `Facture ${o.invoice_number}`,
      title: "Votre facture",
      paragraphs: [`Voici la facture de votre commande n° ${o.number}. Vous pouvez l'ouvrir, l'imprimer ou l'enregistrer en PDF.`],
      body: orderTable(items, o.total_cents),
      primary: { label: "Télécharger ma facture", url: `${site}/facture/${o.id}` },
    }),
  };
}

export function inviteEmail(link: string, role: string) {
  return {
    subject: "Vous êtes invité dans l'équipe du Comptoir du Miam",
    ...renderEmail({
      preheader: "Choisissez votre mot de passe pour accéder à l'espace de gestion.",
      kicker: "Espace de gestion",
      title: "Bienvenue dans l'équipe",
      paragraphs: [
        `Vous avez été invité à rejoindre l'espace de gestion du Comptoir du Miam, avec le niveau <strong>${esc(role)}</strong>.`,
        "Choisissez votre mot de passe pour accéder aux commandes, à la carte et aux stocks.",
      ],
      primary: { label: "Choisir mon mot de passe", url: link },
      note: "Ce lien est personnel et expire au bout de 24 heures.",
    }),
  };
}

export function resetEmail(link: string) {
  return {
    subject: "Nouveau mot de passe · Le Comptoir du Miam",
    ...renderEmail({
      preheader: "Choisissez un nouveau mot de passe en un clic.",
      kicker: "Mot de passe",
      title: "Nouveau mot de passe",
      paragraphs: ["Vous avez demandé à changer votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau."],
      primary: { label: "Choisir un mot de passe", url: link },
      note: "Vous n'avez rien demandé ? Ignorez cet e-mail : votre mot de passe actuel reste valable.",
    }),
  };
}

export function customerCreatedEmail(firstName: string | null, link: string) {
  return {
    subject: "Votre compte Le Comptoir du Miam est prêt",
    ...renderEmail({
      preheader: "Choisissez votre mot de passe pour commander en ligne.",
      kicker: "Votre compte",
      title: `Bonjour${firstName ? " " + firstName : ""} !`,
      paragraphs: ["L'équipe du Comptoir du Miam vous a créé un compte. Choisissez votre mot de passe pour commander en ligne et retrouver vos factures."],
      primary: { label: "Choisir mon mot de passe", url: link },
    }),
  };
}

export function orderReadyEmail(o: { id: string; number: number; mode: string; location: string | null; customer_name?: string | null }) {
  const site = siteUrl();
  const name = o.customer_name?.split(" ")[0];
  const line = o.mode === "mobilhome" ? `Nous l'apportons à votre mobil-home${o.location ? ` (${esc(o.location)})` : ""}.`
    : o.mode === "table" ? "Elle arrive à votre table."
    : "Vous pouvez venir la retirer au comptoir.";
  return {
    subject: `Votre commande n° ${o.number} est prête !`,
    ...renderEmail({
      preheader: `Commande n° ${o.number} prête. ${line.replace(/<[^>]+>/g, "")}`,
      kicker: `Commande n° ${o.number}`,
      title: "C'est prêt !",
      paragraphs: [`${name ? `Bonjour ${esc(name)}, v` : "V"}otre commande est prête. ${line}`, "Bon appétit, et merci d'être passé au Comptoir du Miam."],
      primary: { label: "Voir ma commande", url: `${site}/commande/${o.id}` },
    }),
  };
}
