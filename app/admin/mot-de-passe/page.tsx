"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function MotDePasse() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 10) return setErr("Choisissez au moins 10 caractères.");
    if (pw !== pw2) return setErr("Les deux mots de passe ne sont pas identiques.");
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    if (error) return setErr("Le lien a expiré. Demandez une nouvelle invitation.");
    router.push("/admin");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--encre)", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <form onSubmit={submit} className="stack" style={{ width: "100%", maxWidth: 420, background: "var(--sable)", borderRadius: 10, padding: "32px 28px", gap: 16 }}>
        <h1 className="disp" style={{ fontSize: 32 }}>Choisir mon mot de passe</h1>
        <div className="field"><label className="lbl" htmlFor="pw">Nouveau mot de passe</label><input id="pw" className="in" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <div className="field"><label className="lbl" htmlFor="pw2">Confirmer</label><input id="pw2" className="in" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        {err ? <p className="err" role="alert">{err}</p> : null}
        <button className="btn primary">Enregistrer et entrer</button>
      </form>
    </div>
  );
}
