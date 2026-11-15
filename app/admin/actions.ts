"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";
import { makeAuthLink } from "@/lib/authlinks";
import { sendMail } from "@/lib/mailer";
import { readySms, sendSms, smsConfigured } from "@/lib/sms";
import { pushToUser } from "@/lib/push";
import { customerCreatedEmail, invoiceEmail, inviteEmail, orderReadyEmail } from "@/lib/emails/templates";
import type { OrderStatus, Role } from "@/lib/types";

/** Résultat renvoyé à l'interface : jamais d'exception silencieuse. */
export type Result = { ok: true; message?: string } | { ok: false; error: string };

const STATUSES: OrderStatus[] = ["nouvelle", "en_preparation", "prete", "terminee", "annulee"];
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const money = (v: string) => (v === "" ? null : Math.round(Number(v.replace(",", ".").replace(/\s|€/g, "")) * 100));
const num = (v: string, d = 0) => (v === "" ? d : Number(v.replace(",", ".")));
const isEmail = (v: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);

async function run(fn: () => Promise<Result | void>, paths: string[]): Promise<Result> {
  try {
    const r = await fn();
    paths.forEach((p) => revalidatePath(p));
    return r ?? { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("NEXT_REDIRECT")) throw e;
    return { ok: false, error: msg };
  }
}
function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

// --- Commandes ---------------------------------------------------------------
export async function setOrderStatus(id: string, status: OrderStatus): Promise<Result> {
  return run(async () => {
    const { supabase } = await requireStaff("editeur");
    if (!STATUSES.includes(status)) throw new Error("Statut inconnu");
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    check(error);
  }, ["/admin/commandes", "/admin/cuisine", `/admin/commandes/${id}`]);
}

/**
 * Prévient le client que sa commande est prête : SMS si un service SMS est branché et que le numéro est connu,
 * e-mail dans tous les cas (gratuit). Passe la commande en « Prête » si besoin.
 */
export async function notifyReady(id: string): Promise<Result> {
  return run(async () => {
    await requireStaff("editeur");
    const admin = supabaseService();
    const { data: o, error } = await admin.from("orders").select("id, number, mode, location, status, customer_name, customer_phone, customer_email, user_id").eq("id", id).single();
    check(error);
    if (!o) throw new Error("Commande introuvable.");
    let phone = o.customer_phone as string | null;
    let email = o.customer_email as string | null;
    if ((!phone || !email) && o.user_id) {
      const p = (await admin.from("profiles").select("phone, email").eq("id", o.user_id).single()).data;
      phone = phone ?? p?.phone ?? null;
      email = email ?? p?.email ?? null;
    }
    const sent: string[] = [];
    const problems: string[] = [];
    // 1. Notification de l'application (gratuite). 2. SMS seulement si le client n'a pas l'application.
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
    if (!sent.length) throw new Error(problems[0] ?? "Ni téléphone ni e-mail pour ce client.");
    const patch: Record<string, unknown> = { sms_ready_sent_at: new Date().toISOString() };
    if (o.status === "nouvelle" || o.status === "en_preparation") patch.status = "prete";
    const { error: e2 } = await admin.from("orders").update(patch).eq("id", id);
    check(e2);
    return { ok: true, message: `Client prévenu par ${sent.join(" et ")} (commande n°${o.number}).${problems.length ? " " + problems[0] : ""}` };
  }, ["/admin/cuisine", `/admin/commandes/${id}`, "/admin/commandes"]);
}

export async function sendInvoice(id: string): Promise<Result> {
  return run(async () => {
    await requireStaff("editeur");
    const admin = supabaseService();
    const { data: o, error } = await admin.from("orders").select("id, number, total_cents, paid_at, customer_email, user_id, order_items(name, quantity, unit_price_cents)").eq("id", id).single();
    check(error);
    if (!o) throw new Error("Commande introuvable.");
    if (!o.paid_at) throw new Error("Commande non payée : pas de facture.");
    let to = o.customer_email as string | null;
    if (!to && o.user_id) to = (await admin.from("profiles").select("email").eq("id", o.user_id).single()).data?.email ?? null;
    if (!to) throw new Error("Aucune adresse e-mail pour ce client.");
    const { data: number, error: e2 } = await admin.rpc("assign_invoice_number", { p_order: id });
    check(e2);
    const sent = await sendMail({ to, ...invoiceEmail({ ...o, invoice_number: number as string }, o.order_items ?? []) });
    if (!sent) throw new Error("L'e-mail n'a pas pu partir. Vérifiez les réglages d'envoi (SMTP).");
    return { ok: true, message: `Facture ${number} envoyée à ${to}.` };
  }, [`/admin/commandes/${id}`]);
}

// --- Carte ---------------------------------------------------------------------
export async function saveMenuItem(_: Result | null, fd: FormData): Promise<Result> {
  return run(async () => {
    const { supabase } = await requireStaff("editeur");
    const id = str(fd, "id");
    const price = money(str(fd, "price"));
    const row = {
      category_id: str(fd, "category_id"),
      name: str(fd, "name"),
      description: str(fd, "description") || null,
      price_cents: price ?? -1,
      vat_rate: num(str(fd, "vat_rate"), 10),
      cost_cents: money(str(fd, "cost")),
      available: fd.get("available") === "on",
      stock_item_id: str(fd, "stock_item_id") || null,
    };
    if (!row.name) throw new Error("Indiquez le nom du produit.");
    if (!row.category_id) throw new Error("Choisissez une catégorie.");
    if (!Number.isFinite(row.price_cents) || row.price_cents < 0) throw new Error("Indiquez un prix de vente valide (ex. 12,50).");
    const { error } = id ? await supabase.from("menu_items").update(row).eq("id", id) : await supabase.from("menu_items").insert(row);
    check(error);
    return { ok: true, message: id ? "Produit modifié." : "Produit ajouté." };
  }, ["/admin/carte", "/carte"]);
}

export async function deleteMenuItem(id: string): Promise<Result> {
  return run(async () => {
    const { supabase } = await requireStaff("editeur");
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    check(error);
  }, ["/admin/carte", "/carte"]);
}

export async function saveCategory(_: Result | null, fd: FormData): Promise<Result> {
  return run(async () => {
    const { supabase } = await requireStaff("editeur");
    const id = str(fd, "id");
    const row = { name: str(fd, "name"), moment: str(fd, "moment") || null, position: num(str(fd, "position")), active: fd.get("active") === "on" };
    if (!row.name) throw new Error("Indiquez le nom de la catégorie.");
    const { error } = id ? await supabase.from("menu_categories").update(row).eq("id", id) : await supabase.from("menu_categories").insert(row);
    check(error);
    return { ok: true, message: id ? "Catégorie modifiée." : "Catégorie ajoutée." };
  }, ["/admin/carte", "/carte"]);
}

// --- Stocks --------------------------------------------------------------------
export async function saveStockItem(_: Result | null, fd: FormData): Promise<Result> {
  return run(async () => {
    const { supabase } = await requireStaff("editeur");
    const id = str(fd, "id");
    const row = {
      name: str(fd, "name"),
      section: str(fd, "section"),
      unit: str(fd, "unit") || "unité",
      quantity: num(str(fd, "quantity")),
      alert_threshold: num(str(fd, "alert_threshold")),
      purchase_price_cents: money(str(fd, "purchase_price")),
      vat_rate: num(str(fd, "vat_rate"), 5.5),
      sale_price_cents: money(str(fd, "sale_price")),
      supplier: str(fd, "supplier") || null,
      updated_at: new Date().toISOString(),
    };
    if (!row.name) throw new Error("Indiquez le nom du produit.");
    if (!["sec", "frais", "surgele"].includes(row.section)) throw new Error("Choisissez un rayon.");
    if (![row.quantity, row.alert_threshold, row.vat_rate].every(Number.isFinite)) throw new Error("Vérifiez les nombres saisis.");
    const { error } = id ? await supabase.from("stock_items").update(row).eq("id", id) : await supabase.from("stock_items").insert(row);
    check(error);
    return { ok: true, message: id ? "Produit modifié." : "Produit ajouté au stock." };
  }, ["/admin/stocks", "/admin"]);
}

export async function adjustStock(id: string, delta: number): Promise<Result> {
  return run(async () => {
    const { supabase } = await requireStaff("editeur");
    if (!Number.isFinite(delta)) throw new Error("Quantité invalide");
    const { data, error } = await supabase.from("stock_items").select("quantity").eq("id", id).single();
    check(error);
    const { error: e2 } = await supabase.from("stock_items").update({ quantity: Math.max(0, Number(data!.quantity) + delta), updated_at: new Date().toISOString() }).eq("id", id);
    check(e2);
  }, ["/admin/stocks"]);
}

export async function deleteStockItem(id: string): Promise<Result> {
  return run(async () => {
    const { supabase } = await requireStaff("editeur");
    const { error } = await supabase.from("stock_items").delete().eq("id", id);
    check(error);
  }, ["/admin/stocks"]);
}

// --- Clients -------------------------------------------------------------------
export async function saveClient(_: Result | null, fd: FormData): Promise<Result> {
  return run(async () => {
    await requireStaff("editeur");
    const admin = supabaseService();
    const id = str(fd, "id");
    const email = str(fd, "email").toLowerCase();
    const profile = {
      first_name: str(fd, "first_name") || null,
      last_name: str(fd, "last_name") || null,
      phone: str(fd, "phone") || null,
      postal_code: str(fd, "postal_code") || null,
      on_camping: fd.get("on_camping") === "on",
      mobilhome: fd.get("on_camping") === "on" ? str(fd, "mobilhome") || null : null,
    };
    if (id) {
      const { error } = await admin.from("profiles").update(profile).eq("id", id);
      check(error);
      return { ok: true, message: "Client modifié." };
    }
    if (!isEmail(email)) throw new Error("Indiquez une adresse e-mail valide.");
    const { data, error } = await admin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { ...profile } });
    if (error) throw new Error(/registered|exists/i.test(error.message) ? "Un client existe déjà avec cet e-mail." : error.message);
    const { error: e2 } = await admin.from("profiles").update({ ...profile, created_by_staff: true }).eq("id", data.user.id);
    check(e2);
    if (fd.get("send_email") === "on") {
      const { link } = await makeAuthLink("recovery", email, { next: "/mot-de-passe" });
      const sent = link ? await sendMail({ to: email, ...customerCreatedEmail(profile.first_name, link) }) : false;
      return { ok: true, message: sent ? "Client ajouté. Un e-mail lui a été envoyé pour choisir son mot de passe." : "Client ajouté, mais l'e-mail n'a pas pu partir (réglages SMTP)." };
    }
    return { ok: true, message: "Client ajouté." };
  }, ["/admin/clients"]);
}

// --- Réglages ------------------------------------------------------------------
export async function saveSettings(_: Result | null, fd: FormData): Promise<Result> {
  return run(async () => {
    const { supabase } = await requireStaff("editeur");
    const keys = ["address", "hours", "phone", "contact_email", "instagram_url", "ubereats_url", "camping_name", "opening_label", "legal_name", "legal_address", "siret", "vat_number", "invoice_footer"] as const;
    const row: Record<string, unknown> = { ordering_open: fd.get("ordering_open") === "on", updated_at: new Date().toISOString() };
    for (const k of keys) row[k] = str(fd, k) || null;
    if (fd.has("loyalty_goal")) {
      row.loyalty_enabled = fd.get("loyalty_enabled") === "on";
      const goal = Number(str(fd, "loyalty_goal"));
      if (!Number.isInteger(goal) || goal < 2 || goal > 50) throw new Error("Le nombre de tampons doit être entre 2 et 50.");
      row.loyalty_goal = goal;
      const cents = Math.round(Number(str(fd, "loyalty_reward").replace(",", ".")) * 100);
      if (!Number.isFinite(cents) || cents < 0) throw new Error("Valeur de récompense invalide.");
      row.loyalty_reward_cents = cents;
      row.loyalty_reward_label = str(fd, "loyalty_reward_label") || `${(cents / 100).toFixed(2).replace(".", ",")} € offerts sur votre commande`;
    }
    const { error } = await supabase.from("settings").update(row).eq("id", 1);
    check(error);
    return { ok: true, message: "Réglages enregistrés." };
  }, ["/", "/admin/reglages"]);
}

// --- Équipe (administrateur uniquement) ----------------------------------------
const ROLE_LABEL: Record<string, string> = { lecteur: "Lecteur", editeur: "Éditeur" };

export async function inviteMember(_: Result | null, fd: FormData): Promise<Result> {
  return run(async () => {
    const { user } = await requireStaff("admin");
    const email = str(fd, "email").toLowerCase();
    const role = str(fd, "role") as Role;
    if (!isEmail(email)) throw new Error("Indiquez une adresse e-mail valide.");
    if (role !== "lecteur" && role !== "editeur") throw new Error("Choisissez un niveau d'accès.");
    const admin = supabaseService();

    // Nouvelle personne : lien d'invitation. Personne déjà inscrite (ex. client) : lien de connexion directe.
    let { link, userId, error } = await makeAuthLink("invite", email, { next: "/admin/mot-de-passe" });
    if (!link) {
      if (!/registered|exists/i.test(error ?? "")) throw new Error("Invitation impossible : " + error);
      ({ link, userId, error } = await makeAuthLink("magiclink", email, { next: "/admin" }));
      if (!link) throw new Error("Invitation impossible : " + error);
    }
    const { error: e2 } = await admin.from("staff").upsert({ user_id: userId, email, role, invited_by: user.id });
    check(e2);
    const sent = await sendMail({ to: email, ...inviteEmail(link, ROLE_LABEL[role]) });
    return { ok: true, message: sent ? `Invitation envoyée à ${email}.` : `${email} a bien accès, mais l'e-mail n'a pas pu partir (réglages SMTP).` };
  }, ["/admin/equipe"]);
}

export async function setMemberRole(userId: string, role: string): Promise<Result> {
  return run(async () => {
    const { user } = await requireStaff("admin");
    if (userId === user.id) throw new Error("Vous ne pouvez pas changer votre propre niveau.");
    if (role !== "lecteur" && role !== "editeur") throw new Error("Niveau inconnu");
    const { error } = await supabaseService().from("staff").update({ role }).eq("user_id", userId);
    check(error);
  }, ["/admin/equipe"]);
}

export async function removeMember(userId: string): Promise<Result> {
  return run(async () => {
    const { user } = await requireStaff("admin");
    if (userId === user.id) throw new Error("Vous ne pouvez pas vous retirer vous-même.");
    const { error } = await supabaseService().from("staff").delete().eq("user_id", userId);
    check(error);
  }, ["/admin/equipe"]);
}
