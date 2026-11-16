import Link from "next/link";

export const metadata = { title: "Page introuvable" };

/** Page 404 aux couleurs du Miam. */
export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "var(--sable)" }}>
      <div className="stack" style={{ alignItems: "center", textAlign: "center", gap: 14, maxWidth: 520 }}>
        <img src="/logo.svg" alt="" width={140} height={115} />
        <p className="kick">Erreur 404</p>
        <h1 className="disp" style={{ fontSize: "clamp(36px, 7vw, 56px)" }}>Cette page a pris la vague</h1>
        <p className="muted" style={{ margin: 0 }}>Le lien est peut-être ancien ou mal recopié.</p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link href="/" className="btn primary">Retour à l'accueil</Link>
          <Link href="/commander" className="btn">Commander en ligne</Link>
        </div>
      </div>
    </main>
  );
}
