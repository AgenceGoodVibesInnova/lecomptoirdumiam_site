"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function AdminLogin({ notice }: { notice?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(notice ?? "");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr("");
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setErr("Identifiant ou mot de passe incorrect.");
    router.push("/admin");
    router.refresh();
  }
  async function reset() {
    if (!email) return setErr("Indiquez d'abord votre e-mail.");
    await supabaseBrowser().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/admin/mot-de-passe` });
    setErr("Si ce compte existe, un e-mail de réinitialisation vient d'être envoyé.");
  }

  return (
    <form onSubmit={submit} className="stack" style={{ gap: 16 }}>
      <div className="field"><label className="lbl" htmlFor="a-mail">Identifiant (e-mail)</label><input id="a-mail" className="in" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="field"><label className="lbl" htmlFor="a-mdp">Mot de passe</label><input id="a-mdp" className="in" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      {err ? <p className="err" role="alert">{err}</p> : null}
      <button className="btn primary" disabled={busy}>{busy ? "Connexion…" : "Se connecter"}</button>
      <div className="row" style={{ justifyContent: "space-between", fontSize: 14 }}>
        <button type="button" onClick={reset} style={{ background: "none", border: 0, padding: 0, textDecoration: "underline", cursor: "pointer", font: "inherit" }}>Mot de passe oublié ?</button>
        <a href="/">Retour au site</a>
      </div>
    </form>
  );
}
