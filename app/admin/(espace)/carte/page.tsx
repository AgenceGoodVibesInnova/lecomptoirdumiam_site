import { requireStaff } from "@/lib/auth";
import { deleteMenuItem, saveCategory, saveMenuItem } from "@/app/admin/actions";
import type { MenuCategory, MenuItem, StockItem } from "@/lib/types";

export default async function Carte() {
  const { supabase, role } = await requireStaff();
  const [{ data: c }, { data: i }, { data: s }] = await Promise.all([
    supabase.from("menu_categories").select("*").order("position"),
    supabase.from("menu_items").select("*").order("position"),
    supabase.from("stock_items").select("id, name").order("name"),
  ]);
  const cats = (c ?? []) as MenuCategory[];
  const items = (i ?? []) as MenuItem[];
  const stock = (s ?? []) as Pick<StockItem, "id" | "name">[];
  const edit = role !== "lecteur";
  const price = (v: number) => (v / 100).toFixed(2).replace(".", ",");

  const ItemForm = ({ it, catId }: { it?: MenuItem; catId: string }) => (
    <form action={saveMenuItem} style={{ display: "grid", gridTemplateColumns: "minmax(140px,1.3fr) minmax(160px,2fr) 100px 150px auto auto", gap: 8, alignItems: "center" }} className="item-row">
      <input type="hidden" name="id" value={it?.id ?? ""} />
      <input type="hidden" name="category_id" value={catId} />
      <input className="in" name="name" defaultValue={it?.name} placeholder="Nom du plat" required aria-label="Nom" disabled={!edit} />
      <input className="in" name="description" defaultValue={it?.description ?? ""} placeholder="Description" aria-label="Description" disabled={!edit} />
      <input className="in" name="price" defaultValue={it ? price(it.price_cents) : ""} placeholder="Prix €" required inputMode="decimal" aria-label="Prix en euros" disabled={!edit} />
      <select className="in" name="stock_item_id" defaultValue={it?.stock_item_id ?? ""} aria-label="Article de stock lié" disabled={!edit}>
        <option value="">Pas de stock lié</option>
        {stock.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
      </select>
      <label className="row" style={{ gap: 6, fontSize: 14, flexWrap: "nowrap" }}><input type="checkbox" name="available" defaultChecked={it ? it.available : true} disabled={!edit} />Dispo</label>
      {edit ? <button className="btn small primary">{it ? "Enregistrer" : "Ajouter"}</button> : <span />}
    </form>
  );

  return (
    <>
      <style>{`@media (max-width: 1100px){.item-row{grid-template-columns:1fr 1fr!important}}`}</style>
      <div className="stack" style={{ gap: 4 }}><p className="kick">Gestion</p><h1 className="disp" style={{ fontSize: 40 }}>Carte et menus</h1></div>
      {!edit ? <p className="muted">Vous êtes en lecture seule.</p> : null}
      {cats.map((cat) => (
        <div key={cat.id} className="card stack" style={{ gap: 10 }}>
          <form action={saveCategory} className="row" style={{ gap: 8 }}>
            <input type="hidden" name="id" value={cat.id} />
            <input className="in disp" name="name" defaultValue={cat.name} aria-label="Nom de la catégorie" style={{ maxWidth: 220, fontSize: 20 }} disabled={!edit} />
            <input className="in" name="moment" defaultValue={cat.moment ?? ""} placeholder="Moment (ex. Le matin)" aria-label="Moment" style={{ maxWidth: 200 }} disabled={!edit} />
            <input className="in" name="position" defaultValue={cat.position} aria-label="Ordre" style={{ maxWidth: 80 }} disabled={!edit} />
            <label className="row" style={{ gap: 6, fontSize: 14 }}><input type="checkbox" name="active" defaultChecked={cat.active} disabled={!edit} />Visible</label>
            {edit ? <button className="btn small">Enregistrer</button> : null}
          </form>
          {items.filter((x) => x.category_id === cat.id).map((it) => (
            <div key={it.id} className="row" style={{ gap: 8, flexWrap: "nowrap", alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}><ItemForm it={it} catId={cat.id} /></div>
              {edit ? <form action={deleteMenuItem}><input type="hidden" name="id" value={it.id} /><button className="btn small" aria-label={`Supprimer ${it.name}`}>✕</button></form> : null}
            </div>
          ))}
          {edit ? <div style={{ borderTop: "1px dashed var(--sable-3)", paddingTop: 10 }}><ItemForm catId={cat.id} /></div> : null}
        </div>
      ))}
      {edit ? (
        <form action={saveCategory} className="card row" style={{ gap: 8 }}>
          <input className="in" name="name" placeholder="Nouvelle catégorie" required style={{ maxWidth: 240 }} aria-label="Nouvelle catégorie" />
          <input className="in" name="moment" placeholder="Moment" style={{ maxWidth: 200 }} aria-label="Moment" />
          <input type="hidden" name="active" value="on" />
          <button className="btn small primary">Ajouter la catégorie</button>
        </form>
      ) : null}
    </>
  );
}
