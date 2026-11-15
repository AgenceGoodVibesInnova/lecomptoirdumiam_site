import { requireStaff } from "@/lib/auth";
import { dateHeure, euros } from "@/lib/format";

export default async function Clients({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { supabase } = await requireStaff();
  const q = ((await searchParams).q ?? "").trim().toLowerCase();
  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(1000),
    supabase.from("orders").select("user_id, total_cents, created_at").not("paid_at", "is", null).neq("status", "annulee"),
  ]);
  const rows = (profiles ?? []).map((p) => {
    const mine = (orders ?? []).filter((o) => o.user_id === p.id);
    return { ...p, n: mine.length, total: mine.reduce((s, o) => s + o.total_cents, 0), last: mine.map((o) => o.created_at).sort().at(-1) };
  }).filter((p) => !q || [p.first_name, p.last_name, p.email, p.mobilhome, p.postal_code].some((v) => String(v ?? "").toLowerCase().includes(q)));

  return (
    <>
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <div className="stack" style={{ gap: 4 }}><p className="kick">Fichier clients</p><h1 className="disp" style={{ fontSize: 40 }}>Clients · {rows.length}</h1></div>
        <form className="row" style={{ gap: 8 }}>
          <label htmlFor="q" className="lbl">Rechercher</label>
          <input id="q" name="q" className="in" defaultValue={q} placeholder="Nom, e-mail, mobil-home…" style={{ width: 260 }} />
          <button className="btn small">OK</button>
        </form>
      </div>
      <div className="card scroll">
        <table className="t">
          <thead><tr><th>Client</th><th>E-mail</th><th>Code postal</th><th>Camping</th><th>Mobil-home</th><th className="num">Commandes</th><th className="num">Total</th><th>Dernière commande</th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td style={{ fontWeight: 600 }}>{`${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || "—"}</td>
                <td className="muted">{p.email}</td>
                <td>{p.postal_code ?? "—"}</td>
                <td>{p.on_camping ? <span className="badge en_preparation">Oui</span> : <span className="badge">Non</span>}</td>
                <td>{p.mobilhome ?? "—"}</td>
                <td className="num">{p.n}</td>
                <td className="num">{euros(p.total)}</td>
                <td>{p.last ? dateHeure(p.last) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
