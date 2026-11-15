import { requireStaff } from "@/lib/auth";
import { adjustStock, deleteStockItem, saveStockItem } from "@/app/admin/actions";
import type { StockItem } from "@/lib/types";

const SECTIONS = [["sec", "Sec"], ["frais", "Frais"], ["surgele", "Surgelé"]] as const;

export default async function Stocks() {
  const { supabase, role } = await requireStaff();
  const { data } = await supabase.from("stock_items").select("*").order("name");
  const items = (data ?? []) as StockItem[];
  const edit = role !== "lecteur";
  const alertes = items.filter((i) => Number(i.quantity) <= Number(i.alert_threshold));

  return (
    <>
      <div className="stack" style={{ gap: 4 }}><p className="kick">Épicerie</p><h1 className="disp" style={{ fontSize: 40 }}>Stocks</h1></div>
      {alertes.length ? <div className="card" style={{ borderColor: "var(--rouge)" }}><strong style={{ color: "var(--rouge)" }}>À recommander :</strong> {alertes.map((a) => `${a.name} (${a.quantity} ${a.unit})`).join(", ")}</div> : null}
      {SECTIONS.map(([key, label]) => (
        <div key={key} className="card stack" style={{ gap: 8 }}>
          <h2 className="disp" style={{ fontSize: 24 }}>{label}</h2>
          <div className="scroll"><table className="t">
            <thead><tr><th>Produit</th><th className="num">Quantité</th><th className="num">Seuil d'alerte</th><th>Mouvement</th><th /></tr></thead>
            <tbody>
              {items.filter((i) => i.section === key).map((i) => {
                const low = Number(i.quantity) <= Number(i.alert_threshold);
                return (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600 }}>{i.name}</td>
                    <td className="num" style={{ color: low ? "var(--rouge)" : undefined, fontWeight: 700 }}>{i.quantity} {i.unit}</td>
                    <td className="num muted">{i.alert_threshold}</td>
                    <td>
                      {edit ? (
                        <form action={adjustStock} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                          <input type="hidden" name="id" value={i.id} />
                          <input className="in" name="delta" placeholder="+10 ou −3" aria-label={`Entrée ou sortie pour ${i.name}`} style={{ maxWidth: 110, minHeight: 36 }} />
                          <button className="btn small">Appliquer</button>
                        </form>
                      ) : null}
                    </td>
                    <td>{edit ? <form action={deleteStockItem}><input type="hidden" name="id" value={i.id} /><button className="btn small" aria-label={`Supprimer ${i.name}`}>✕</button></form> : null}</td>
                  </tr>
                );
              })}
            </tbody>
          </table></div>
        </div>
      ))}
      {edit ? (
        <form action={saveStockItem} className="card row" style={{ gap: 8 }}>
          <input className="in" name="name" placeholder="Nouveau produit" required style={{ maxWidth: 220 }} aria-label="Nom du produit" />
          <select className="in" name="section" style={{ maxWidth: 140 }} aria-label="Rayon">{SECTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <input className="in" name="unit" placeholder="Unité (pièce, kg…)" style={{ maxWidth: 160 }} aria-label="Unité" />
          <input className="in" name="quantity" placeholder="Quantité" inputMode="decimal" style={{ maxWidth: 110 }} aria-label="Quantité" />
          <input className="in" name="alert_threshold" placeholder="Seuil" inputMode="decimal" style={{ maxWidth: 100 }} aria-label="Seuil d'alerte" />
          <button className="btn small primary">Ajouter</button>
        </form>
      ) : null}
      <p className="muted" style={{ fontSize: 14 }}>Les articles d'épicerie vendus en ligne sont décomptés automatiquement quand ils sont liés à un produit de stock (page Carte et menus).</p>
    </>
  );
}
