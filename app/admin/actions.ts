"use server";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/auth";
import { supabaseService } from "@/lib/supabase/server";
import type { OrderStatus, Role } from "@/lib/types";

const STATUSES: OrderStatus[] = ["nouvelle", "en_preparation", "prete", "terminee", "annulee"];
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const cents = (v: string) => Math.round(Number(v.replace(",", ".")) * 100);

// --- Commandes ---------------------------------------------------------------
export async function setOrderStatus(id: string, status: OrderStatus) {
  const { supabase } = await requireStaff("editeur");
  if (!STATUSES.includes(status)) throw new Error("Statut inconnu");
  await supabase.from("orders").update({ status }).eq("id", id);
  revalidatePath("/admin/commandes");
  revalidatePath("/admin/cuisine");
}

export async function setOrderStatusForm(fd: FormData) {
  await setOrderStatus(str(fd, "id"), str(fd, "status") as OrderStatus);
}

// --- Carte ---------------------------------------------------------------------
export async function saveMenuItem(fd: FormData) {
  const { supabase } = await requireStaff("editeur");
  const id = str(fd, "id");
  const row = {
    category_id: str(fd, "category_id"),
    name: str(fd, "name"),
    description: str(fd, "description") || null,
    price_cents: cents(str(fd, "price")),
    available: fd.get("available") === "on",
    stock_item_id: str(fd, "stock_item_id") || null,
  };
  if (!row.name || !Number.isFinite(row.price_cents) || row.price_cents < 0) throw new Error("Nom et prix requis");
  if (id) await supabase.from("menu_items").update(row).eq("id", id);
  else await supabase.from("menu_items").insert(row);
  revalidatePath("/admin/carte");
  revalidatePath("/carte");
}

export async function deleteMenuItem(fd: FormData) {
  const { supabase } = await requireStaff("editeur");
  await supabase.from("menu_items").delete().eq("id", str(fd, "id"));
  revalidatePath("/admin/carte");
}

export async function saveCategory(fd: FormData) {
  const { supabase } = await requireStaff("editeur");
  const id = str(fd, "id");
  const row = { name: str(fd, "name"), moment: str(fd, "moment") || null, position: Number(str(fd, "position") || 0), active: fd.get("active") === "on" };
  if (!row.name) throw new Error("Nom requis");
  if (id) await supabase.from("menu_categories").update(row).eq("id", id);
  else await supabase.from("menu_categories").insert(row);
  revalidatePath("/admin/carte");
}

// --- Stocks --------------------------------------------------------------------
export async function saveStockItem(fd: FormData) {
  const { supabase } = await requireStaff("editeur");
  const id = str(fd, "id");
  const row = {
    name: str(fd, "name"),
    section: str(fd, "section"),
    unit: str(fd, "unit") || "unité",
    quantity: Number(str(fd, "quantity").replace(",", ".") || 0),
    alert_threshold: Number(str(fd, "alert_threshold").replace(",", ".") || 0),
    updated_at: new Date().toISOString(),
  };
  if (!row.name || !["sec", "frais", "surgele"].includes(row.section)) throw new Error("Nom et rayon requis");
  if (id) await supabase.from("stock_items").update(row).eq("id", id);
  else await supabase.from("stock_items").insert(row);
  revalidatePath("/admin/stocks");
}

export async function adjustStock(fd: FormData) {
  const { supabase } = await requireStaff("editeur");
  const id = str(fd, "id");
  const delta = Number(str(fd, "delta").replace(",", "."));
  const { data } = await supabase.from("stock_items").select("quantity").eq("id", id).single();
  if (!data || !Number.isFinite(delta)) return;
  await supabase.from("stock_items").update({ quantity: Math.max(0, Number(data.quantity) + delta), updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/stocks");
}

export async function deleteStockItem(fd: FormData) {
  const { supabase } = await requireStaff("editeur");
  await supabase.from("stock_items").delete().eq("id", str(fd, "id"));
  revalidatePath("/admin/stocks");
}

// --- Réglages ------------------------------------------------------------------
export async function saveSettings(fd: FormData) {
  const { supabase } = await requireStaff("editeur");
  const keys = ["address", "hours", "phone", "contact_email", "instagram_url", "ubereats_url", "camping_name", "opening_label"] as const;
  const row: Record<string, unknown> = { ordering_open: fd.get("ordering_open") === "on", updated_at: new Date().toISOString() };
  for (const k of keys) row[k] = str(fd, k) || null;
  await supabase.from("settings").update(row).eq("id", 1);
  revalidatePath("/", "layout");
}

// --- Équipe (administrateur uniquement) ----------------------------------------
export async function inviteMember(fd: FormData) {
  const { user } = await requireStaff("admin");
  const email = str(fd, "email").toLowerCase();
  const role = str(fd, "role") as Role;
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("E-mail invalide");
  if (role !== "lecteur" && role !== "editeur") throw new Error("Niveau invalide");
  const admin = supabaseService();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  let userId: string | undefined;
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${site}/admin/mot-de-passe` });
  if (data?.user) userId = data.user.id;
  if (error) {
    // La personne a peut-être déjà un compte client : on lui donne simplement l'accès.
    const { data: existing } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
    userId = existing?.id;
    if (!userId) throw new Error("Invitation impossible : " + error.message);
  }
  await admin.from("staff").upsert({ user_id: userId, email, role, invited_by: user.id });
  revalidatePath("/admin/equipe");
}

export async function setMemberRole(fd: FormData) {
  const { user } = await requireStaff("admin");
  const id = str(fd, "user_id");
  const role = str(fd, "role");
  if (id === user.id || (role !== "lecteur" && role !== "editeur")) return;
  await supabaseService().from("staff").update({ role }).eq("user_id", id);
  revalidatePath("/admin/equipe");
}

export async function removeMember(fd: FormData) {
  const { user } = await requireStaff("admin");
  const id = str(fd, "user_id");
  if (id === user.id) return;
  await supabaseService().from("staff").delete().eq("user_id", id);
  revalidatePath("/admin/equipe");
}
