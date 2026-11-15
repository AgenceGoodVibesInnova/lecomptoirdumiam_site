import AuthForm from "@/components/AuthForm";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connexion" };

export default async function Connexion({ searchParams }: { searchParams: Promise<{ suite?: string }> }) {
  const { suite } = await searchParams;
  const s = await getSettings();
  const next = suite && suite.startsWith("/") && !suite.startsWith("//") ? suite : "/compte";
  return (
    <section>
      <div className="wrap stack" style={{ maxWidth: 500, gap: 20 }}>
        <AuthForm next={next} camping={s.camping_name ?? "La Dune des Sables"} />
        {s.instagram_url ? (
          <a href={s.instagram_url} className="card dark row" style={{ textDecoration: "none", gap: 14 }}>
            <span className="disp" style={{ fontSize: 20, fontWeight: 600 }}>Nous suivre sur Instagram</span>
            <span className="muted" style={{ fontSize: 15 }}>Plats du jour, arrivages de l'épicerie et soirées ↗</span>
          </a>
        ) : null}
      </div>
    </section>
  );
}
