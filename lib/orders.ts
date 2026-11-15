import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMail } from "./mailer";
import { orderConfirmationEmail } from "./emails/templates";

/** Marque une commande payée (une seule fois), attribue la facture et envoie la confirmation. */
export async function markPaid(admin: SupabaseClient, id: string) {
  const { data: updated } = await admin.from("orders").update({ status: "nouvelle", paid_at: new Date().toISOString() })
    .eq("id", id).is("paid_at", null)
    .select("id, number, mode, location, total_cents, customer_email, is_demo, order_items(name, quantity, unit_price_cents)").maybeSingle();
  if (updated) {
    await admin.rpc("assign_invoice_number", { p_order: id });
    if (updated.customer_email) await sendMail({ to: updated.customer_email, ...orderConfirmationEmail(updated, updated.order_items ?? []) });
  }
  return !!updated;
}
