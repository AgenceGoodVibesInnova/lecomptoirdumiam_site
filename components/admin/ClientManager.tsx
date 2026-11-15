"use client";
import { useActionState, useEffect, useState } from "react";
import { saveClient, type Result } from "@/app/admin/actions";
import { Drawer, Field, Flash, Icon, PageHead } from "./ui";
import { dateHeure, euros } from "@/lib/format";

export type ClientRow = {
  id: string; email: string | null; first_name: string | null; last_name: string | null; phone: string | null; postal_code: string | null;
  on_camping: boolean; mobilhome: string | null; created_at: string; n: number; total: number; last: string | null;
};

export default function ClientManager({ rows, canEdit }: { rows: ClientRow[]; canEdit: boolean }) {
  const [editing, setEditing] = useState<ClientRow | "new" | null>(null);
  const [q, setQ] = useState("");
  const [camp, setCamp] = useState<"all" | "yes" | "no">("all");
  const list = rows.filter((r) =>
    (camp === "all" || (camp === "yes") === r.on_camping) &&
    (!q || [r.first_name, r.last_name, r.email, r.mobilhome, r.postal_code, r.phone].some((v) => String(v ?? "").toLowerCase().includes(q.toLowerCase()))));
  const name = (r: ClientRow) => `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim() || "—";

  return (
    <>
      <PageHead kicker="Fichier clients" title={`Clients · ${rows.length}`}>
        {canEdit ? <button className="a-btn primary" onClick={() => setEditing("new")}>{Icon.plus} Ajouter un client</button> : null}
      </PageHead>
      <div className="a-head" style={{ alignItems: "center" }}>
        <div className="a-tabs" role="group" aria-label="Filtrer">
          <button aria-pressed={camp === "all"} onClick={() => setCamp("all")}>Tous</button>
          <button aria-pressed={camp === "yes"} onClick={() => setCamp("yes")}>En vacances au camping</button>
          <button aria-pressed={camp === "no"} onClick={() => setCamp("no")}>Locaux et autres</button>
        </div>
        <input className="a-search" type="search" placeholder="Nom, e-mail, mobil-home, téléphone…" aria-label="Rechercher un client" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <section className="a-card a-scroll">
        {list.length ? (
          <table className="a-table">
            <thead><tr><th>Client</th><th>Contact</th><th>Code postal</th><th>Camping</th><th className="r">Commandes</th><th className="r">Total dépensé</th><th>Dernière commande</th><th /></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td><strong>{name(r)}</strong><div className="a-muted" style={{ fontSize: 12 }}>Inscrit le {new Date(r.created_at).toLocaleDateString("fr-FR")}</div></td>
                  <td>{r.email}{r.phone ? <div className="a-muted" style={{ fontSize: 12 }}>{r.phone}</div> : null}</td>
                  <td>{r.postal_code ?? <span className="a-muted">—</span>}</td>
                  <td>{r.on_camping ? <span className="a-pill okp">MH {r.mobilhome ?? "?"}</span> : <span className="a-muted">—</span>}</td>
                  <td className="r">{r.n}</td>
                  <td className="r">{euros(r.total)}</td>
                  <td>{r.last ? dateHeure(r.last) : <span className="a-muted">—</span>}</td>
                  <td className="actions">{canEdit ? <button className="a-icon" aria-label={`Modifier ${name(r)}`} onClick={() => setEditing(r)}>{Icon.pencil}</button> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="a-empty">{rows.length ? "Aucun client ne correspond à la recherche." : "Pas encore de client inscrit. Ils apparaîtront ici dès leur première inscription."}</p>}
      </section>
      <Drawer open={!!editing} title={editing === "new" ? "Ajouter un client" : "Modifier le client"} onClose={() => setEditing(null)}>
        {editing ? <ClientForm key={editing === "new" ? "new" : editing.id} c={editing === "new" ? null : editing} onDone={() => setEditing(null)} /> : null}
      </Drawer>
    </>
  );
}

function ClientForm({ c, onDone }: { c: ClientRow | null; onDone: () => void }) {
  const [state, action, pending] = useActionState<Result | null, FormData>(saveClient, null);
  const [camp, setCamp] = useState(c?.on_camping ?? false);
  useEffect(() => { if (state?.ok) { const t = setTimeout(onDone, 1400); return () => clearTimeout(t); } }, [state, onDone]);
  return (
    <form action={action} className="a-form">
      <input type="hidden" name="id" value={c?.id ?? ""} />
      <Field label="Prénom" htmlFor="cl-first"><input id="cl-first" name="first_name" defaultValue={c?.first_name ?? ""} autoComplete="off" /></Field>
      <Field label="Nom" htmlFor="cl-last"><input id="cl-last" name="last_name" defaultValue={c?.last_name ?? ""} autoComplete="off" /></Field>
      <Field label="E-mail" htmlFor="cl-mail" span hint={c ? "L'e-mail sert d'identifiant : il ne se modifie pas ici." : undefined}>
        <input id="cl-mail" name="email" type="email" defaultValue={c?.email ?? ""} required={!c} disabled={!!c} autoComplete="off" />
      </Field>
      <Field label="Téléphone" htmlFor="cl-tel"><input id="cl-tel" name="phone" type="tel" defaultValue={c?.phone ?? ""} /></Field>
      <Field label="Code postal" htmlFor="cl-cp"><input id="cl-cp" name="postal_code" inputMode="numeric" defaultValue={c?.postal_code ?? ""} /></Field>
      <label className="a-check"><input type="checkbox" name="on_camping" checked={camp} onChange={(e) => setCamp(e.target.checked)} /> En vacances au camping</label>
      {camp ? <Field label="N° de mobil-home" htmlFor="cl-mh"><input id="cl-mh" name="mobilhome" defaultValue={c?.mobilhome ?? ""} /></Field> : null}
      {!c ? <label className="a-check"><input type="checkbox" name="send_email" defaultChecked /> Lui envoyer un e-mail pour choisir son mot de passe</label> : null}
      <Flash result={state} />
      <div className="a-form-actions"><button type="button" className="a-btn" onClick={onDone}>Annuler</button><button className="a-btn primary" disabled={pending}>{pending ? "Enregistrement…" : c ? "Enregistrer" : "Ajouter le client"}</button></div>
    </form>
  );
}
