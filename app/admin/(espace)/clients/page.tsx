import ClientManager, { type ClientRow } from "@/components/admin/ClientManager";
import { requireStaff } from "@/lib/auth";

export default async function Clients() {
  const { supabase, role } = await requireStaff();
  const [{ data: profiles }, { data: orders }, { data: staff }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(2000),
    supabase.from("orders").select("user_id, total_cents, created_at").not("paid_at", "is", null).neq("status", "annulee"),
    supabase.from("staff").select("user_id"),
  ]);
  const staffIds = new Set((staff ?? []).map((s) => s.user_id));
  const rows: ClientRow[] = (profiles ?? []).filter((p) => !staffIds.has(p.id)).map((p) => {
    const mine = (orders ?? []).filter((o) => o.user_id === p.id);
    return {
      id: p.id, email: p.email, first_name: p.first_name, last_name: p.last_name, phone: p.phone, postal_code: p.postal_code,
      on_camping: p.on_camping, mobilhome: p.mobilhome, created_at: p.created_at,
      n: mine.length, total: mine.reduce((s, o) => s + o.total_cents, 0), last: mine.map((o) => o.created_at).sort().at(-1) ?? null,
    };
  });
  return <ClientManager rows={rows} canEdit={role !== "lecteur"} />;
}
