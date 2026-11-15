import TeamManager from "@/components/admin/TeamManager";
import { requireStaff } from "@/lib/auth";

export default async function Equipe() {
  const { supabase, role, user } = await requireStaff();
  const { data } = await supabase.from("staff").select("user_id, email, role, created_at").order("created_at");
  return <TeamManager members={data ?? []} isAdmin={role === "admin"} me={user.id} />;
}
