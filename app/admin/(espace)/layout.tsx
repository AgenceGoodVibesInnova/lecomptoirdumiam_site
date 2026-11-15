import AdminNav from "@/components/AdminNav";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Espace administratif", robots: { index: false } };

const LABEL = { admin: "Administrateur", editeur: "Éditeur", lecteur: "Lecteur" } as const;

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { email, role, supabase } = await requireStaff();
  const { count } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "nouvelle").or("paid_at.not.is.null,source.eq.equipe");
  return (
    <div className="adm">
      <AdminNav email={email} role={LABEL[role]} pending={count ?? 0} />
      <div className="adm-main">{children}</div>
    </div>
  );
}
