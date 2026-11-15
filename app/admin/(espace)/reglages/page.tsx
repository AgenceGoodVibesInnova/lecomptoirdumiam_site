import { requireStaff } from "@/lib/auth";
import { saveSettings } from "@/app/admin/actions";
import { getSettings } from "@/lib/settings";

const FIELDS = [
  ["opening_label", "Bandeau d'ouverture", "ex. Ouverture le 1er avril 2027"],
  ["camping_name", "Nom du camping", ""],
  ["address", "Adresse", ""],
  ["hours", "Horaires", "ex. Tous les jours, 8h–22h"],
  ["phone", "Téléphone", ""],
  ["contact_email", "E-mail de contact", ""],
  ["instagram_url", "Lien Instagram", "https://www.instagram.com/…"],
  ["ubereats_url", "Lien de la page Uber Eats", "https://www.ubereats.com/…"],
] as const;

export default async function Reglages() {
  const { role } = await requireStaff();
  const s = await getSettings();
  const edit = role !== "lecteur";
  return (
    <>
      <div className="stack" style={{ gap: 4 }}><p className="kick">Restaurant</p><h1 className="disp" style={{ fontSize: 40 }}>Réglages</h1></div>
      <form action={saveSettings} className="card stack" style={{ gap: 14, maxWidth: 720 }}>
        <label className="check" htmlFor="open"><input id="open" type="checkbox" name="ordering_open" defaultChecked={s.ordering_open} disabled={!edit} /><span><strong>Commande en ligne ouverte</strong><br /><span className="muted" style={{ fontSize: 15 }}>Décochez pour suspendre les commandes (fermeture, coup de feu…).</span></span></label>
        {FIELDS.map(([k, label, ph]) => (
          <div key={k} className="field">
            <label className="lbl" htmlFor={k}>{label}</label>
            {k === "hours" || k === "address"
              ? <textarea id={k} name={k} className="in" defaultValue={s[k] ?? ""} placeholder={ph} disabled={!edit} />
              : <input id={k} name={k} className="in" defaultValue={s[k] ?? ""} placeholder={ph} disabled={!edit} />}
          </div>
        ))}
        <p className="muted" style={{ fontSize: 14, margin: 0 }}>Les champs laissés vides n'apparaissent pas sur le site.</p>
        {edit ? <button className="btn primary">Enregistrer</button> : null}
      </form>
    </>
  );
}
