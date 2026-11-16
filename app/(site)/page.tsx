import Link from "next/link";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const MOMENTS = [
  { when: "Le matin", name: "Brunch", text: "Viennoiseries, œufs, fruits frais et jus pressés, pour bien démarrer la journée." },
  { when: "Le midi", name: "Snack", text: "Sur place ou à emporter : de quoi manger sur le pouce entre deux baignades." },
  { when: "Le soir", name: "Restaurant", text: "Une cuisine maison de produits frais, en salle ou en terrasse au coucher du soleil." },
  { when: "Toute la journée", name: "Épicerie", text: "Des corners de produits locaux, ou l'oubli des dernières courses, sans reprendre la voiture." },
];

export default async function Home() {
  const s = await getSettings();
  const infos = [
    { k: "Saison", v: "Avril → Octobre" },
    s.hours ? { k: "Horaires", v: s.hours } : null,
    s.address ? { k: "Adresse", v: s.address } : null,
    s.phone || s.contact_email ? { k: "Contact", v: [s.phone, s.contact_email].filter(Boolean).join("\n") } : null,
  ].filter(Boolean) as { k: string; v: string }[];

  return (
    <>
      <section style={{ paddingBottom: 40 }}>
        <div className="wrap grid2" style={{ alignItems: "center", gap: 48 }}>
          <div className="stack" style={{ alignItems: "flex-start", gap: 20 }}>
            {s.opening_label ? (
              <span className="row" style={{ gap: 10, background: "var(--encre)", color: "var(--sable)", padding: "7px 16px 7px 12px", borderRadius: 999, fontFamily: "var(--display)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 600, fontSize: 14 }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--eclair)" }} />{s.opening_label}
              </span>
            ) : null}
            <h1 className="disp" style={{ fontSize: "clamp(44px, 6vw, 76px)" }}>Une cuisine <span className="hl">sincère</span>, les pieds dans le sable</h1>
            <p className="muted" style={{ fontSize: 20, margin: 0, maxWidth: "34ch" }}>Brunch, snack, restaurant et épicerie au cœur du camping {s.camping_name}. Ouvert d'avril à octobre.</p>
            <div className="row">
              <Link href="/commander" className="btn primary">Commander en ligne</Link>
              <Link href="/carte" className="btn">Découvrir la carte</Link>
            </div>
          </div>
          <img src="/logo.svg" width={488} height={403} fetchPriority="high" alt="Le Comptoir du Miam : planche de surf noire marquée d'un éclair jaune devant un soleil couchant" style={{ width: "100%", maxWidth: 480, height: "auto", justifySelf: "center" }} />
        </div>
      </section>

      <div className="dark" style={{ padding: "18px 0" }}>
        <div className="wrap row disp" style={{ justifyContent: "space-between", fontSize: "clamp(20px, 3vw, 30px)", fontWeight: 600 }}>
          <span>Brunch</span><span style={{ color: "var(--eclair)" }}>/</span><span>Snack</span><span style={{ color: "var(--eclair)" }}>/</span><span>Restaurant</span><span style={{ color: "var(--eclair)" }}>/</span><span>Épicerie</span>
        </div>
      </div>

      <section>
        <div className="wrap stack" style={{ gap: 40 }}>
          <div className="stack" style={{ gap: 12 }}>
            <p className="kick">Notre mission</p>
            <h2 className="disp" style={{ fontSize: "clamp(32px, 5vw, 54px)", fontWeight: 600, maxWidth: "20ch" }}>Créer des moments simples et vrais, autour d'une cuisine sincère.</h2>
          </div>
          <div className="grid3">
            {[
              ["Local et de saison", "Des produits frais, choisis chez les producteurs du coin et cuisinés au fil des saisons."],
              ["Chaleureux et détendu", "Une ambiance surf et chill, du bois patiné, du mobilier chiné : un lieu qui a du caractère."],
              ["Un accueil vrai", "Une équipe stable et attentive, pour les vacanciers du camping comme pour les locaux."],
            ].map(([t, d]) => (
              <div key={t} className="stack" style={{ borderTop: "3px solid var(--encre)", paddingTop: 16, gap: 8 }}>
                <h3 className="disp" style={{ fontSize: 26, fontWeight: 600 }}>{t}</h3>
                <p className="muted" style={{ margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "var(--sable-2)" }}>
        <div className="wrap stack" style={{ gap: 36 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
            <div className="stack" style={{ gap: 10 }}>
              <p className="kick">La carte</p>
              <h2 className="disp" style={{ fontSize: "clamp(36px, 5vw, 60px)" }}>Du premier café au dernier verre</h2>
            </div>
            <Link href="/carte" className="btn">Voir toute la carte</Link>
          </div>
          <div className="grid4">
            {MOMENTS.map((m) => (
              <div key={m.name} className="stack" style={{ background: "var(--sable)", borderRadius: 6, padding: 22, gap: 8 }}>
                <span className="kick">{m.when}</span>
                <h3 className="disp" style={{ fontSize: 28, fontWeight: 600 }}>{m.name}</h3>
                <p className="muted" style={{ margin: 0, fontSize: 16 }}>{m.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="epicerie">
        <div className="wrap grid2" style={{ gap: 56, alignItems: "start" }}>
          <div className="stack">
            <p className="kick">L'épicerie</p>
            <h2 className="disp" style={{ fontSize: "clamp(36px, 5vw, 60px)" }}>L'épicerie est dans la salle</h2>
            <p className="muted" style={{ margin: 0, maxWidth: "40ch" }}>Pas besoin de chercher une supérette : les rayons sont installés dans le restaurant. Vous faites vos courses en prenant un café.</p>
          </div>
          <div className="stack" style={{ gap: 12 }}>
            {[["Sec", "Rayon", "L'essentiel du placard", "Pâtes, conserves, condiments, biscuits et produits du terroir."],
              ["+4 °C", "Frais", "Le frais", "Produits laitiers, boissons fraîches, fruits et légumes de saison."],
              ["−18 °C", "Surgelé", "Le congélateur", "Glaces et produits surgelés pour le mobil-home."]].map(([t, k, h, d]) => (
              <div key={h} className="card" style={{ display: "grid", gridTemplateColumns: "110px minmax(0,1fr)", gap: 16, alignItems: "center" }}>
                <div><div className="disp" style={{ fontSize: 30 }}>{t}</div><div className="kick" style={{ fontSize: 11 }}>{k}</div></div>
                <div><h3 className="disp" style={{ fontSize: 20, fontWeight: 600 }}>{h}</h3><p className="muted" style={{ margin: 0, fontSize: 16 }}>{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dark">
        <div className="wrap stack" style={{ gap: 18 }}>
          <p className="kick" style={{ color: "var(--eclair)" }}>Commande en ligne</p>
          <h2 className="disp" style={{ fontSize: "clamp(36px, 5vw, 60px)" }}>Commandez <span style={{ color: "var(--eclair)" }}>en ligne</span></h2>
          <p className="muted" style={{ margin: "0 0 18px", maxWidth: "52ch", fontSize: 19 }}>Livré chez vous, apporté à votre mobil-home, à emporter ou servi à table : choisissez comment vous voulez manger.</p>
          <div className="grid4">
            {[["En livraison", "Livré chez vous par Uber Eats."], ["À votre mobil-home", "On vous apporte votre commande sur votre emplacement."], ["À emporter", "Commandez, puis récupérez au comptoir sans attendre."], ["À table", "Commandez depuis votre table, on vous sert."]].map(([t, d], i) => (
              <div key={t} className="stack" style={{ border: "1px solid var(--encre-2)", borderRadius: 6, padding: 22, gap: 8 }}>
                <span className="disp" style={{ fontSize: 44, color: "var(--eclair)" }}>{i + 1}</span>
                <h3 className="disp" style={{ fontSize: 22, fontWeight: 600 }}>{t}</h3>
                <p className="muted" style={{ margin: 0, fontSize: 16 }}>{d}</p>
              </div>
            ))}
          </div>
          <div><Link href="/commander" className="btn yellow" style={{ marginTop: 10 }}>Commander en ligne</Link></div>
        </div>
      </section>

      <section style={{ background: "var(--sable-2)" }} id="infos">
        <div className="wrap stack" style={{ gap: 32 }}>
          <div className="stack" style={{ gap: 10 }}>
            <p className="kick">Infos pratiques</p>
            <h2 className="disp" style={{ fontSize: "clamp(36px, 5vw, 60px)" }}>Venir au Miam</h2>
          </div>
          <div className="grid4">
            {infos.map((i) => (
              <div key={i.k} className="stack" style={{ background: "var(--sable)", borderRadius: 6, padding: 22, gap: 6 }}>
                <span className="kick">{i.k}</span>
                <p style={{ margin: 0, whiteSpace: "pre-line" }}>{i.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
