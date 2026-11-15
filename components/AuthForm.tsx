"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

// Boutons affichés seulement une fois le fournisseur activé dans Supabase (variables Vercel à "1").
const GOOGLE = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";
const FACEBOOK = process.env.NEXT_PUBLIC_AUTH_FACEBOOK === "1";

export default function AuthForm({ next, camping }: { next: string; camping: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("login");
  const [f, setF] = useState({ last_name: "", first_name: "", phone: "", postal_code: "", on_camping: true, mobilhome: "", email: "", password: "" });
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });
  const callback = () => `${window.location.origin}/auth/callback?suite=${encodeURIComponent(next)}`;

  async function oauth(provider: "google" | "facebook") {
    await supabaseBrowser().auth.signInWithOAuth({ provider, options: { redirectTo: callback() } });
  }

  async function forgot() {
    setMsg({});
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) return setMsg({ err: "Indiquez d'abord votre e-mail dans le champ ci-dessus." });
    await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: f.email }) });
    setMsg({ ok: "Si un compte existe avec cet e-mail, vous allez recevoir un lien pour choisir un nouveau mot de passe." });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg({});
    setBusy(true);
    const sb = supabaseBrowser();
    if (mode === "login") {
      const { error } = await sb.auth.signInWithPassword({ email: f.email, password: f.password });
      setBusy(false);
      if (error) return setMsg({ err: "E-mail ou mot de passe incorrect." });
      router.push(next);
      router.refresh();
      return;
    }
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, mobilhome: f.on_camping ? f.mobilhome : null, next }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ err: data.error ?? "L'inscription n'a pas abouti. Réessayez." });
    setMsg({ ok: "Compte créé ! Cliquez sur le lien reçu par e-mail pour l'activer." });
  }

  const tab = (m: "signup" | "login", label: string) => (
    <button type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setMsg({}); }}
      style={{ minHeight: 48, border: 0, cursor: "pointer", font: "600 16px var(--display)", textTransform: "uppercase", letterSpacing: ".06em", background: mode === m ? "var(--encre)" : "transparent", color: mode === m ? "var(--sable)" : "var(--encre)" }}>
      {label}
    </button>
  );

  return (
    <div className="stack" style={{ gap: 20 }}>
      <div className="stack" style={{ alignItems: "center", textAlign: "center", gap: 8 }}>
        <h1 className="disp" style={{ fontSize: 48 }}>{mode === "signup" ? "Créer un compte" : "Bon retour !"}</h1>
        <p className="muted" style={{ margin: 0 }}>{mode === "signup" ? "Un compte pour commander en quelques secondes à chaque visite." : "Connectez-vous pour passer votre commande."}</p>
      </div>
      <div role="tablist" aria-label="Connexion ou inscription" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "2px solid var(--encre)", borderRadius: 6, overflow: "hidden" }}>
        {tab("login", "Se connecter")}{tab("signup", "Créer un compte")}
      </div>
      <form onSubmit={submit} className="card stack" style={{ gap: 16 }}>
        {GOOGLE ? <button type="button" className="btn" onClick={() => oauth("google")}>{mode === "signup" ? "S'inscrire" : "Se connecter"} avec Google</button> : null}
        {FACEBOOK ? <button type="button" className="btn" onClick={() => oauth("facebook")}>{mode === "signup" ? "S'inscrire" : "Se connecter"} avec Facebook</button> : null}
        {GOOGLE || FACEBOOK ? <div className="row muted" style={{ fontSize: 14, gap: 10 }} aria-hidden="true"><span style={{ flex: 1, height: 1, background: "var(--sable-3)" }} />ou avec votre e-mail<span style={{ flex: 1, height: 1, background: "var(--sable-3)" }} /></div> : null}
        {mode === "signup" ? (
          <>
            <div className="grid2" style={{ gap: 14 }}>
              <div className="field"><label className="lbl" htmlFor="nom">Nom</label><input id="nom" className="in" required autoComplete="family-name" value={f.last_name} onChange={set("last_name")} /></div>
              <div className="field"><label className="lbl" htmlFor="prenom">Prénom</label><input id="prenom" className="in" required autoComplete="given-name" value={f.first_name} onChange={set("first_name")} /></div>
            </div>
            <div className="field"><label className="lbl" htmlFor="tel">Téléphone mobile</label><input id="tel" className="in" type="tel" inputMode="tel" autoComplete="tel" value={f.phone} onChange={set("phone")} placeholder="06 12 34 56 78" /><span className="muted" style={{ fontSize: 13 }}>Pour être prévenu par SMS quand votre commande est prête.</span></div>
            <div className="field"><label className="lbl" htmlFor="cp">Code postal de résidence</label><input id="cp" className="in" required inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{4,5}" value={f.postal_code} onChange={set("postal_code")} style={{ maxWidth: 180 }} /></div>
            <label className="check" htmlFor="vacances" style={f.on_camping ? { background: "#f4f3c4", borderColor: "var(--encre)" } : undefined}>
              <input id="vacances" type="checkbox" checked={f.on_camping} onChange={set("on_camping")} />
              <span>Je suis en vacances au camping <strong>{camping}</strong></span>
            </label>
            {f.on_camping ? <div className="field"><label className="lbl" htmlFor="mh">N° de mobil-home</label><input id="mh" className="in" value={f.mobilhome} onChange={set("mobilhome")} style={{ maxWidth: 180 }} /></div> : null}
          </>
        ) : null}
        <div className="field"><label className="lbl" htmlFor="mail">E-mail</label><input id="mail" className="in" type="email" required autoComplete="email" value={f.email} onChange={set("email")} /></div>
        <div className="field"><label className="lbl" htmlFor="mdp">Mot de passe</label><PasswordInput id="mdp" className="in" required autoComplete={mode === "signup" ? "new-password" : "current-password"} value={f.password} onChange={set("password")} /></div>
        {mode === "login" ? (
          <button type="button" onClick={forgot} style={{ alignSelf: "flex-end", background: "none", border: 0, padding: 0, textDecoration: "underline", cursor: "pointer", font: "inherit", fontSize: 15 }}>Mot de passe oublié ?</button>
        ) : null}
        {msg.err ? <p className="err" role="alert">{msg.err}</p> : null}
        {msg.ok ? <p className="ok" role="status">{msg.ok}</p> : null}
        <button className="btn primary" disabled={busy}>{busy ? "Un instant…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}</button>
      </form>
    </div>
  );
}
