import AdminLogin from "@/components/AdminLogin";

export const metadata = { title: "Connexion administrateur" };

export default async function Page({ searchParams }: { searchParams: Promise<{ refus?: string; lien?: string }> }) {
  const sp = await searchParams;
  const notice = sp.refus ? "Ce compte n'a pas accès à l'espace administratif." : sp.lien ? "Ce lien a expiré. Demandez une nouvelle invitation." : undefined;
  return (
    <div style={{ minHeight: "100vh", background: "var(--encre)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div className="stack" style={{ width: "100%", maxWidth: 420, background: "var(--sable)", borderRadius: 10, padding: "32px 28px", gap: 18 }}>
        <div className="stack" style={{ alignItems: "center", textAlign: "center", gap: 10 }}>
          <img src="/logo.svg" alt="Le Comptoir du Miam" style={{ width: 140 }} />
          <span className="badge" style={{ background: "var(--encre)", color: "var(--eclair)" }}>Espace administratif</span>
          <h1 className="disp" style={{ fontSize: 34 }}>Connexion</h1>
        </div>
        <AdminLogin notice={notice} />
        <p className="muted" style={{ margin: 0, fontSize: 13, textAlign: "center" }}>Accès réservé à l'équipe du Comptoir du Miam. Les comptes sont créés sur invitation.</p>
      </div>
    </div>
  );
}
