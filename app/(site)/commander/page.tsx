import Link from "next/link";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commander en ligne" };

const OPTIONS = [
  { href: "/commander/mobilhome", title: "Depuis votre mobil-home", text: "On vous apporte votre commande sur votre emplacement." },
  { href: "/commander/emporter", title: "À emporter au comptoir", text: "Commandez, puis récupérez au comptoir sans attendre." },
  { href: "/commander/table", title: "À table", text: "Commandez depuis votre table, on vous sert." },
];

export default async function Commander() {
  const s = await getSettings();
  return (
    <section>
      <div className="wrap stack" style={{ gap: 36, alignItems: "center" }}>
        <div className="stack" style={{ alignItems: "center", textAlign: "center", gap: 12 }}>
          <img src="/logo.svg" alt="" style={{ width: 140 }} />
          <h1 className="disp" style={{ fontSize: "clamp(40px, 6vw, 64px)" }}>Commander en ligne</h1>
          <p className="muted" style={{ margin: 0, fontSize: 19 }}>Comment voulez-vous manger aujourd'hui ?</p>
          {!s.ordering_open ? <p className="badge nouvelle" style={{ fontSize: 15 }}>La commande en ligne ouvrira avec le restaurant.</p> : null}
        </div>
        <div className="grid2" style={{ maxWidth: 920, width: "100%" }}>
          {s.ubereats_url ? (
            <a href={s.ubereats_url} className="card dark stack" style={{ textDecoration: "none", gap: 6, minHeight: 140, justifyContent: "center", borderColor: "var(--encre)" }}>
              <span className="disp" style={{ fontSize: 28, fontWeight: 600 }}>En livraison</span>
              <span className="muted">Livré chez vous par Uber Eats.</span>
              <span style={{ color: "var(--eclair)", fontWeight: 600, fontSize: 15 }}>Continuer sur Uber Eats ↗</span>
            </a>
          ) : (
            <div className="card dark stack" style={{ gap: 6, minHeight: 140, justifyContent: "center", opacity: 0.8 }}>
              <span className="disp" style={{ fontSize: 28, fontWeight: 600 }}>En livraison</span>
              <span className="muted">Livraison par Uber Eats : bientôt disponible.</span>
            </div>
          )}
          {OPTIONS.map((o) => (
            <Link key={o.href} href={o.href} className="card stack" style={{ textDecoration: "none", gap: 6, minHeight: 140, justifyContent: "center", border: "2px solid var(--encre)" }}>
              <span className="disp" style={{ fontSize: 28, fontWeight: 600 }}>{o.title}</span>
              <span className="muted">{o.text}</span>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Se connecter ou créer un compte →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
