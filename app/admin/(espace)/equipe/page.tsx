import { requireStaff } from "@/lib/auth";
import { inviteMember, removeMember, setMemberRole } from "@/app/admin/actions";

const LABEL: Record<string, string> = { admin: "Administrateur", editeur: "Éditeur", lecteur: "Lecteur" };

export default async function Equipe() {
  const { supabase, role, user } = await requireStaff();
  const { data } = await supabase.from("staff").select("*").order("created_at");
  const isAdmin = role === "admin";

  return (
    <>
      <div className="stack" style={{ gap: 4 }}><p className="kick">Accès</p><h1 className="disp" style={{ fontSize: 40 }}>Équipe</h1></div>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(260px, 1fr) minmax(0, 2fr)", gap: 22, alignItems: "start" }} className="team">
        <style>{`@media (max-width: 900px){.team{grid-template-columns:minmax(0,1fr)!important}}`}</style>
        {isAdmin ? (
          <form action={inviteMember} className="card stack" style={{ gap: 14 }}>
            <h2 className="disp" style={{ fontSize: 22 }}>Inviter une personne</h2>
            <div className="field"><label className="lbl" htmlFor="inv-mail">E-mail</label><input id="inv-mail" name="email" type="email" required className="in" placeholder="prenom@exemple.fr" /></div>
            <div className="field"><label className="lbl" htmlFor="inv-role">Niveau d'accès</label>
              <select id="inv-role" name="role" className="in"><option value="lecteur">Lecteur</option><option value="editeur">Éditeur</option></select></div>
            <button className="btn primary">Envoyer l'invitation</button>
            <div className="stack muted" style={{ gap: 6, fontSize: 14, borderTop: "1px solid var(--sable-3)", paddingTop: 10 }}>
              <span><strong>Lecteur :</strong> voit tout, ne modifie rien.</span>
              <span><strong>Éditeur :</strong> gère commandes, carte, stocks et réglages.</span>
              <span><strong>Administrateur :</strong> seul à inviter ou retirer des personnes.</span>
            </div>
          </form>
        ) : <p className="card muted">Seul l'administrateur peut inviter des personnes.</p>}
        <div className="card scroll">
          <table className="t">
            <thead><tr><th>Personne</th><th>Niveau</th><th /></tr></thead>
            <tbody>
              {(data ?? []).map((m) => (
                <tr key={m.user_id}>
                  <td style={{ fontWeight: 600 }}>{m.email}</td>
                  <td>
                    {isAdmin && m.user_id !== user.id && m.role !== "admin" ? (
                      <form action={setMemberRole} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                        <input type="hidden" name="user_id" value={m.user_id} />
                        <select name="role" defaultValue={m.role} className="in" style={{ minHeight: 36, maxWidth: 140 }} aria-label={`Niveau de ${m.email}`}>
                          <option value="lecteur">Lecteur</option><option value="editeur">Éditeur</option>
                        </select>
                        <button className="btn small">OK</button>
                      </form>
                    ) : <span className={`badge ${m.role === "admin" ? "nouvelle" : ""}`}>{LABEL[m.role]}</span>}
                  </td>
                  <td className="num">
                    {isAdmin && m.user_id !== user.id && m.role !== "admin" ? (
                      <form action={removeMember}><input type="hidden" name="user_id" value={m.user_id} /><button className="btn small">Retirer</button></form>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
