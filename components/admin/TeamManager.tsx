"use client";
import { useActionState, useEffect, useState } from "react";
import { inviteMember, removeMember, setMemberRole, type Result } from "@/app/admin/actions";
import { Drawer, Field, Flash, Icon, PageHead, useToast } from "./ui";

type Member = { user_id: string; email: string; role: string; created_at: string };
const LABEL: Record<string, string> = { admin: "Administrateur", editeur: "Éditeur", lecteur: "Lecteur" };
const HELP: Record<string, string> = {
  lecteur: "Voit les commandes, la carte, les stocks et les clients, sans rien modifier.",
  editeur: "Gère les commandes, la carte, les stocks, les clients et les réglages.",
  admin: "Tous les droits, et le seul à pouvoir inviter ou retirer des personnes.",
};

export default function TeamManager({ members, isAdmin, me }: { members: Member[]; isAdmin: boolean; me: string }) {
  const [open, setOpen] = useState(false);
  const toast = useToast();
  return (
    <>
      <PageHead kicker="Accès" title="Équipe">
        {isAdmin ? <button className="a-btn primary" onClick={() => setOpen(true)}>{Icon.plus} Inviter une personne</button> : null}
      </PageHead>
      <section className="a-card a-scroll">
        <table className="a-table">
          <thead><tr><th>Personne</th><th>Niveau d'accès</th><th>Ajoutée le</th><th /></tr></thead>
          <tbody>
            {members.map((m) => {
              const editable = isAdmin && m.user_id !== me && m.role !== "admin";
              return (
                <tr key={m.user_id}>
                  <td><strong>{m.email}</strong>{m.user_id === me ? <span className="a-muted"> · vous</span> : null}</td>
                  <td>
                    {editable ? (
                      <select className="a-in" style={{ width: 150, height: 30 }} aria-label={`Niveau de ${m.email}`} defaultValue={m.role}
                        onChange={async (e) => toast.show({ ...(await setMemberRole(m.user_id, e.target.value)), message: "Niveau modifié." } as Result)}>
                        <option value="lecteur">Lecteur</option><option value="editeur">Éditeur</option>
                      </select>
                    ) : <span className={`a-pill ${m.role === "admin" ? "nouvelle" : ""}`}>{LABEL[m.role]}</span>}
                    <div className="a-muted" style={{ fontSize: 12, marginTop: 2 }}>{HELP[m.role]}</div>
                  </td>
                  <td className="a-muted">{new Date(m.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="actions">{editable ? <button className="a-icon danger" aria-label={`Retirer ${m.email}`} onClick={async () => { if (confirm(`Retirer l'accès de ${m.email} ?`)) toast.show(await removeMember(m.user_id)); }}>{Icon.trash}</button> : null}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
      {!isAdmin ? <p className="a-muted">Seul l'administrateur peut inviter ou retirer des personnes.</p> : null}
      <Drawer open={open} title="Inviter une personne" onClose={() => setOpen(false)}>
        {open ? <InviteForm onDone={() => setOpen(false)} /> : null}
      </Drawer>
      {toast.node}
    </>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState<Result | null, FormData>(inviteMember, null);
  const [role, setRole] = useState("lecteur");
  useEffect(() => { if (state?.ok) { const t = setTimeout(onDone, 1600); return () => clearTimeout(t); } }, [state, onDone]);
  return (
    <form action={action} className="a-form">
      <Field label="E-mail de la personne" htmlFor="inv-mail" span><input id="inv-mail" name="email" type="email" required placeholder="prenom@exemple.fr" /></Field>
      <Field label="Niveau d'accès" htmlFor="inv-role" span hint={HELP[role]}>
        <select id="inv-role" name="role" value={role} onChange={(e) => setRole(e.target.value)}><option value="lecteur">Lecteur</option><option value="editeur">Éditeur</option></select>
      </Field>
      <p className="a-hint span" style={{ margin: 0 }}>La personne reçoit un e-mail pour choisir son mot de passe, puis accède au même espace que vous, selon son niveau.</p>
      <Flash result={state} />
      <div className="a-form-actions"><button type="button" className="a-btn" onClick={onDone}>Annuler</button><button className="a-btn primary" disabled={pending}>{pending ? "Envoi…" : "Envoyer l'invitation"}</button></div>
    </form>
  );
}
