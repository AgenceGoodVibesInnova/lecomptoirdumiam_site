"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { deleteMenuItem, saveCategory, saveMenuItem, type Result } from "@/app/admin/actions";
import { centsToInput, Drawer, Field, Flash, Icon, PageHead, useToast } from "./ui";
import { euros } from "@/lib/format";
import { htFromTtc, pct } from "@/lib/vat";
import type { MenuCategory, MenuItem, StockItem } from "@/lib/types";

type Stock = Pick<StockItem, "id" | "name" | "purchase_price_cents">;
const VAT = [["10", "10 % · restauration sur place / à emporter"], ["5.5", "5,5 % · épicerie, produits alimentaires"], ["20", "20 % · alcools"]] as const;

/** Coût de revient : saisi à la main, sinon le prix d'achat HT du produit de stock lié. */
function costOf(it: MenuItem, stock: Stock[]) {
  if (it.cost_cents != null) return it.cost_cents;
  const s = stock.find((x) => x.id === it.stock_item_id);
  return s?.purchase_price_cents ?? null;
}

export default function MenuManager({ categories, items, stock, canEdit }: { categories: MenuCategory[]; items: MenuItem[]; stock: Stock[]; canEdit: boolean }) {
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [newCat, setNewCat] = useState<string>("");
  const [catEdit, setCatEdit] = useState<MenuCategory | "new" | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [q, setQ] = useState("");
  const toast = useToast();

  const shown = categories.filter((c) => filter === "all" || c.id === filter);
  const match = (it: MenuItem) => !q || it.name.toLowerCase().includes(q.toLowerCase());

  return (
    <>
      <PageHead kicker="Gestion" title="Carte et menus">
        {canEdit ? <button className="a-btn" onClick={() => setCatEdit("new")}>{Icon.plus} Catégorie</button> : null}
        {canEdit ? <button className="a-btn primary" onClick={() => { setNewCat(filter !== "all" ? filter : categories[0]?.id ?? ""); setEditing("new"); }}>{Icon.plus} Ajouter un produit</button> : null}
      </PageHead>

      <div className="a-head" style={{ alignItems: "center" }}>
        <div className="a-tabs" role="group" aria-label="Filtrer par catégorie">
          <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>Toutes</button>
          {categories.map((c) => <button key={c.id} aria-pressed={filter === c.id} onClick={() => setFilter(c.id)}>{c.name}{!c.active ? " (masquée)" : ""}</button>)}
        </div>
        <input className="a-search" type="search" placeholder="Rechercher un produit…" aria-label="Rechercher un produit" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {shown.map((c) => {
        const list = items.filter((i) => i.category_id === c.id && match(i));
        return (
          <section key={c.id} className="a-card">
            <div className="a-section-head">
              <h2>{c.name} <span className="a-muted" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>· {c.moment ?? ""} · {list.length} produit{list.length > 1 ? "s" : ""}{!c.active ? " · masquée sur le site" : ""}</span></h2>
              {canEdit ? (
                <div style={{ display: "flex", gap: 4 }}>
                  <button className="a-icon" aria-label={`Modifier la catégorie ${c.name}`} onClick={() => setCatEdit(c)}>{Icon.pencil}</button>
                  <button className="a-btn sm" onClick={() => { setNewCat(c.id); setEditing("new"); }}>{Icon.plus} Produit</button>
                </div>
              ) : null}
            </div>
            {list.length ? (
              <div className="a-scroll">
                <table className="a-table">
                  <thead><tr><th>Produit</th><th className="r">Prix TTC</th><th className="r">TVA</th><th className="r">Prix HT</th><th className="r">Coût de revient</th><th className="r">Marge</th><th>Statut</th><th /></tr></thead>
                  <tbody>
                    {list.map((it) => {
                      const ht = htFromTtc(it.price_cents, Number(it.vat_rate));
                      const cost = costOf(it, stock);
                      const margin = cost != null ? ht - cost : null;
                      return (
                        <tr key={it.id}>
                          <td><button className="a-link" onClick={() => setEditing(it)} disabled={!canEdit} style={{ all: "unset", cursor: canEdit ? "pointer" : "default", fontWeight: 600 }}>{it.name}</button>{it.description ? <div className="a-muted" style={{ fontSize: 12 }}>{it.description}</div> : null}</td>
                          <td className="r">{euros(it.price_cents)}</td>
                          <td className="r a-muted">{pct(Number(it.vat_rate))}</td>
                          <td className="r">{euros(ht)}</td>
                          <td className="r">{cost != null ? euros(cost) : <span className="a-muted">—</span>}</td>
                          <td className="r">{margin != null ? <><strong>{euros(margin)}</strong> <span className="a-muted">({ht ? pct((margin / ht) * 100) : "—"})</span></> : <span className="a-muted">—</span>}</td>
                          <td>{it.available ? <span className="a-pill okp">Disponible</span> : <span className="a-pill">Épuisé</span>}</td>
                          <td className="actions">
                            {canEdit ? <>
                              <button className="a-icon" aria-label={`Modifier ${it.name}`} onClick={() => setEditing(it)}>{Icon.pencil}</button>
                              <button className="a-icon danger" aria-label={`Supprimer ${it.name}`} onClick={async () => { if (confirm(`Supprimer « ${it.name} » de la carte ?`)) toast.show(await deleteMenuItem(it.id)); }}>{Icon.trash}</button>
                            </> : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : <p className="a-empty">Aucun produit{q ? " ne correspond à la recherche" : " dans cette catégorie"}.</p>}
          </section>
        );
      })}

      <Drawer open={!!editing} title={editing === "new" ? "Ajouter un produit" : "Modifier le produit"} onClose={() => setEditing(null)}>
        {editing ? <ItemForm key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} defaultCat={newCat} categories={categories} stock={stock} onDone={(r) => { setEditing(null); if (r) toast.show(r); }} /> : null}
      </Drawer>
      <Drawer open={!!catEdit} title={catEdit === "new" ? "Nouvelle catégorie" : "Modifier la catégorie"} onClose={() => setCatEdit(null)}>
        {catEdit ? <CategoryForm key={catEdit === "new" ? "new" : catEdit.id} cat={catEdit === "new" ? null : catEdit} onDone={(r) => { setCatEdit(null); if (r) toast.show(r); }} /> : null}
      </Drawer>
      {toast.node}
    </>
  );
}

function ItemForm({ item, defaultCat, categories, stock, onDone }: { item: MenuItem | null; defaultCat: string; categories: MenuCategory[]; stock: Stock[]; onDone: (r?: Result) => void }) {
  const [state, action, pending] = useActionState<Result | null, FormData>(saveMenuItem, null);
  const [price, setPrice] = useState(centsToInput(item?.price_cents));
  const [vat, setVat] = useState(String(item?.vat_rate ?? 10));
  const [cost, setCost] = useState(centsToInput(item?.cost_cents));
  const [stockId, setStockId] = useState(item?.stock_item_id ?? "");
  useEffect(() => { if (state?.ok) onDone(state); }, [state, onDone]);

  const calc = useMemo(() => {
    const p = Math.round(Number(price.replace(",", ".")) * 100);
    const c = cost ? Math.round(Number(cost.replace(",", ".")) * 100) : stock.find((s) => s.id === stockId)?.purchase_price_cents ?? null;
    if (!Number.isFinite(p) || p <= 0) return null;
    const ht = htFromTtc(p, Number(vat));
    return { ht, cost: c, margin: c != null ? ht - c : null, coef: c ? p / c : null };
  }, [price, vat, cost, stockId, stock]);

  return (
    <form action={action} className="a-form">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field label="Nom du produit" htmlFor="m-name" span><input id="m-name" name="name" defaultValue={item?.name} required /></Field>
      <Field label="Description" htmlFor="m-desc" span><input id="m-desc" name="description" defaultValue={item?.description ?? ""} placeholder="Facultatif, affichée sur la carte" /></Field>
      <Field label="Catégorie" htmlFor="m-cat"><select id="m-cat" name="category_id" defaultValue={item?.category_id ?? defaultCat}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
      <Field label="Prix de vente TTC (€)" htmlFor="m-price"><input id="m-price" name="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="12,50" required /></Field>
      <Field label="TVA" htmlFor="m-vat" span><select id="m-vat" name="vat_rate" value={vat} onChange={(e) => setVat(e.target.value)}>{VAT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
      <h3>Coût de revient</h3>
      <Field label="Coût de revient HT (€)" htmlFor="m-cost" hint="Matières premières par portion. Laissez vide pour reprendre le prix d'achat du produit de stock lié."><input id="m-cost" name="cost" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="ex. 3,80" /></Field>
      <Field label="Produit de stock lié" htmlFor="m-stock" hint="Décompté du stock à chaque vente en ligne."><select id="m-stock" name="stock_item_id" value={stockId} onChange={(e) => setStockId(e.target.value)}><option value="">Aucun</option>{stock.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
      {calc ? (
        <div className="a-calc" aria-live="polite">
          <div>Prix HT<strong>{euros(calc.ht)}</strong></div>
          <div>Marge brute HT<strong>{calc.margin != null ? euros(calc.margin) : "—"}</strong></div>
          <div>Taux de marge<strong>{calc.margin != null && calc.ht ? pct((calc.margin / calc.ht) * 100) : "—"}</strong></div>
        </div>
      ) : null}
      <label className="a-check"><input type="checkbox" name="available" defaultChecked={item ? item.available : true} /> Disponible à la vente</label>
      <Flash result={state} />
      <div className="a-form-actions"><button type="button" className="a-btn" onClick={() => onDone()}>Annuler</button><button className="a-btn primary" disabled={pending}>{pending ? "Enregistrement…" : item ? "Enregistrer" : "Ajouter à la carte"}</button></div>
    </form>
  );
}

function CategoryForm({ cat, onDone }: { cat: MenuCategory | null; onDone: (r?: Result) => void }) {
  const [state, action, pending] = useActionState<Result | null, FormData>(saveCategory, null);
  useEffect(() => { if (state?.ok) onDone(state); }, [state, onDone]);
  return (
    <form action={action} className="a-form">
      <input type="hidden" name="id" value={cat?.id ?? ""} />
      <Field label="Nom" htmlFor="c-name" span><input id="c-name" name="name" defaultValue={cat?.name} required /></Field>
      <Field label="Moment" htmlFor="c-moment"><input id="c-moment" name="moment" defaultValue={cat?.moment ?? ""} placeholder="ex. Le matin" /></Field>
      <Field label="Ordre d'affichage" htmlFor="c-pos"><input id="c-pos" name="position" inputMode="numeric" defaultValue={cat?.position ?? 10} /></Field>
      <label className="a-check"><input type="checkbox" name="active" defaultChecked={cat ? cat.active : true} /> Visible sur le site</label>
      <Flash result={state} />
      <div className="a-form-actions"><button type="button" className="a-btn" onClick={() => onDone()}>Annuler</button><button className="a-btn primary" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button></div>
    </form>
  );
}
