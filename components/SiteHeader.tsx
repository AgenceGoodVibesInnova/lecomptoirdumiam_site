import Link from "next/link";
import { currentUser } from "@/lib/auth";

export default async function SiteHeader() {
  const user = await currentUser().catch(() => null);
  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" className="brand">Le Comptoir du Miam</Link>
        <nav className="nav" aria-label="Navigation principale">
          <Link href="/carte">La carte</Link>
          <Link href="/#epicerie">L'épicerie</Link>
          <Link href="/#infos">Infos</Link>
          {user ? <Link href="/compte">Mon compte</Link> : <Link href="/connexion">Se connecter</Link>}
          <Link href="/commander" className="btn primary small">Commander en ligne</Link>
        </nav>
      </div>
    </header>
  );
}
