"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

/**
 * Page d'arrivée des liens « invitation » et « mot de passe oublié ».
 * Les e-mails par défaut de Supabase renvoient ici avec la session dans l'URL :
 * soit un ?code=… (flux PKCE), soit #access_token=…&refresh_token=… (flux implicite).
 */
export default function SetPassword({ next, back }: { next: string; back: string }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    const sb = supabaseBrowser();
    (async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.slice(1));
      const code = url.searchParams.get("code");
      if (hash.get("access_token") && hash.get("refresh_token")) {
        await sb.auth.setSession({ access_token: hash.get("access_token")!, refresh_token: hash.get("refresh_token")! });
        window.history.replaceState(null, "", url.pathname);
      } else if (code) {
        await sb.auth.exchangeCodeForSession(code);
        window.history.replaceState(null, "", url.pathname);
      }
      const { data } = await sb.auth.getUser();
      if (!data.user) setErr(hash.get("error_description") ?? "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau.");
      setReady(true);
    })();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 10) return setErr("Choisissez au moins 10 caractères.");
    if (pw !== pw2) return setErr("Les deux mots de passe ne sont pas identiques.");
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    if (error) return setErr("Le lien a expiré. Demandez-en un nouveau.");
    router.push(next);
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--encre)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <form onSubmit={submit} className="stack" style={{ width: "100%", maxWidth: 420, background: "var(--sable)", borderRadius: 10, padding: "32px 28px", gap: 16 }}>
        <h1 className="disp" style={{ fontSize: 32 }}>Choisir mon mot de passe</h1>
        {!ready ? <p className="muted">Vérification du lien…</p> : null}
        <div className="field"><label className="lbl" htmlFor="pw">Nouveau mot de passe</label><PasswordInput id="pw" className="in" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} disabled={!ready} /></div>
        <div className="field"><label className="lbl" htmlFor="pw2">Confirmer</label><PasswordInput id="pw2" className="in" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} disabled={!ready} /></div>
        {err ? <p className="err" role="alert">{err}</p> : null}
        <button className="btn primary" disabled={!ready}>Enregistrer et entrer</button>
        <a href={back} style={{ fontSize: 14 }}>Retour à la connexion</a>
      </form>
    </div>
  );
}
