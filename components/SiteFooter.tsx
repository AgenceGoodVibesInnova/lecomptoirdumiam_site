import Link from "next/link";

export default function SiteFooter({ instagram }: { instagram?: string | null }) {
  return (
    <footer className="foot">
      <div className="wrap">
        <span className="disp" style={{ fontSize: 22, color: "var(--sable)" }}>Le Comptoir du Miam</span>
        <span>Brunch · Snack · Restaurant · Épicerie</span>
        <span className="row" style={{ gap: 20 }}>
          {instagram ? <a href={instagram}>Instagram</a> : null}
          <Link href="/admin/connexion">Accès administrateur</Link>
        </span>
      </div>
    </footer>
  );
}
