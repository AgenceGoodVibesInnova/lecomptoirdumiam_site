import AdminNav from "@/components/AdminNav";
import { requireStaff } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Espace administratif", robots: { index: false } };

const LABEL = { admin: "Administrateur", editeur: "Éditeur", lecteur: "Lecteur" } as const;

export default async function Layout({ children }: { children: React.ReactNode }) {
  const { email, role } = await requireStaff();
  return (
    <div className="adm">
      <AdminNav email={email} role={LABEL[role]} />
      <div className="adm-main">{children}</div>
    </div>
  );
}
