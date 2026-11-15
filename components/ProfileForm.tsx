"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type P = { first_name: string; last_name: string; postal_code: string; on_camping: boolean; mobilhome: string };

export default function ProfileForm({ profile, userId }: { profile: P; userId: string }) {
  const router = useRouter();
  const [p, setP] = useState(profile);
  const [msg, setMsg] = useState("");
  const set = (k: keyof P) => (e: React.ChangeEvent<HTMLInputElement>) => setP({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabaseBrowser().from("profiles").update({ ...p, mobilhome: p.on_camping ? p.mobilhome : null }).eq("id", userId);
    setMsg(error ? "Enregistrement impossible. Réessayez." : "Informations enregistrées.");
    router.refresh();
  }
  async function logout() {
    await supabaseBrowser().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card stack" style={{ gap: 12 }}>
      <h2 className="disp" style={{ fontSize: 24 }}>Mes informations</h2>
      <div className="field"><label className="lbl" htmlFor="p-prenom">Prénom</label><input id="p-prenom" className="in" value={p.first_name} onChange={set("first_name")} /></div>
      <div className="field"><label className="lbl" htmlFor="p-nom">Nom</label><input id="p-nom" className="in" value={p.last_name} onChange={set("last_name")} /></div>
      <div className="field"><label className="lbl" htmlFor="p-cp">Code postal</label><input id="p-cp" className="in" value={p.postal_code} onChange={set("postal_code")} /></div>
      <label className="check" htmlFor="p-camp"><input id="p-camp" type="checkbox" checked={p.on_camping} onChange={set("on_camping")} /><span>En vacances au camping</span></label>
      {p.on_camping ? <div className="field"><label className="lbl" htmlFor="p-mh">N° de mobil-home</label><input id="p-mh" className="in" value={p.mobilhome} onChange={set("mobilhome")} /></div> : null}
      {msg ? <p className="ok" role="status">{msg}</p> : null}
      <button className="btn primary small">Enregistrer</button>
      <button type="button" className="btn small" onClick={logout}>Se déconnecter</button>
    </form>
  );
}
