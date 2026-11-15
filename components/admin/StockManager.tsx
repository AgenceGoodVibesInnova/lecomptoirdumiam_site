"use client";
import { useActionState, useEffect, useMemo, useState } from "react";
import { adjustStock, deleteStockItem, saveStockItem, type Result } from "@/app/admin/actions";
import { centsToInput, Drawer, Field, Flash, Icon, PageHead, useToast } from "./ui";
import { euros } from "@/lib/format";
import { htFromTtc, pct } from "@/lib/vat";
import type { StockItem } from "@/lib/types";

const SECTIONS = [["sec", "Sec"], ["frais", "Frais"], ["surgele", "Surgelé"]] as const;
const VAT = [["5.5", "5,5 % · alimentaire"], ["10", "10 % · plats préparés"], ["20", "20 % · alcools, non alimentaire"]] as const;
const qty = (n: number) => Number(n).toLocaleString("fr-FR", { maximumFractionDigits: 2 });

export default function StockManager({ items, canEdit }: { items: StockItem[]; canEdit: boolean }) {
  const [editing, setEditing] = useState<StockItem | "new" | null>(null);
  const [section, setSection] = useState<string>("all");
  const [onlyLow, setOnlyLow] = useState(false);
  const [q, setQ] = useState("");
  const toast = useToast();

  const low = (i: StockItem) => Number(i.quantity) <= Number(i.alert_threshold);
  const list = items.filter((i) => (section === "all" || i.section === section) && (!onlyLow || low(i)) && (!q || i.name.toLowerCase().includes(q.toLowerCase())));
  const value = items.reduce((s, i) => s + (i.purchase_price_cents ?? 0) * Number(i.quantity), 0);
  const alerts = items.filter(low);

  async function move(i: StockItem) {
    const v = prompt(`Entrée (+) ou sortie (−) pour « ${i.name} » (en ${i.unit}) :`, "+");
    if (v == null) return;
    const d = Number(v.replace(",", ".").replace("−", "-"));
    if (!Number.isFinite(d) || d === 0) return toast.show({ ok: false, error: "Quantité invalide : tapez par exemple +12 ou -3." });
    toast.show(await adjustStock(i.id, d));
  }

  return (
    <>
      <PageHead kicker="Épicerie" title="Stocks">
        {canEdit ? <button className="a-btn primary" onClick={() => setEditing("new")}>{Icon.plus} Ajouter un produit</button> : null}
      </PageHead>

      <div className="a-kpis">
        <div className="a-kpi"><span className="k">Produits suivis</span><span className="v">{items.length}</span></div>
        <div className="a-kpi"><span className="k">Valeur du stock (achat HT)</span><span className="v">{euros(value)}</span></div>
        <button className={`a-kpi${alerts.length ? " alert" : ""}`} style={{ textAlign: "left", cursor: "pointer", font: "inherit" }} onClick={() => setOnlyLow(!onlyLow)} aria-pressed={onlyLow}>
          <span className="k">À recommander</span><span className="v">{alerts.length}</span>
          <span className="s">{onlyLow ? "Filtre actif · cliquer pour tout voir" : alerts.length ? "Cliquer pour filtrer" : "Rien sous le seuil"}</span>
        </button>
      </div>

      <div className="a-head" style={{ alignItems: "center" }}>
        <div className="a-tabs" role="group" aria-label="Rayon">
          <button aria-pressed={section === "all"} onClick={() => setSection("all")}>Tous les rayons</button>
          {SECTIONS.map(([k, l]) => <button key={k} aria-pressed={section === k} onClick={() => setSection(k)}>{l}</button>)}
        </div>
        <input className="a-search" type="search" placeholder="Rechercher…" aria-label="Rechercher un produit" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <section className="a-card a-scroll">
        {list.length ? (
          <table className="a-table">
            <thead><tr><th>Produit</th><th>Rayon</th><th className="r">Stock</th><th className="r">Seuil</th><th className="r">Achat HT</th><th className="r">Vente TTC</th><th className="r">Marge / unité</th><th className="r">Valeur</th><th /></tr></thead>
            <tbody>
              {list.map((i) => {
                const saleHt = i.sale_price_cents != null ? htFromTtc(i.sale_price_cents, Number(i.vat_rate)) : null;
                const m = saleHt != null && i.purchase_price_cents != null ? saleHt - i.purchase_price_cents : null;
                return (
                  <tr key={i.id}>
                    <td><strong>{i.name}</strong>{i.supplier ? <div className="a-muted" style={{ fontSize: 12 }}>{i.supplier}</div> : null}</td>
                    <td className="a-muted">{SECTIONS.find(([k]) => k === i.section)?.[1]}</td>
                    <td className="r">{low(i) ? <span className="a-pill low">{qty(i.quantity)} {i.unit}</span> : <>{qty(i.quantity)} <span className="a-muted">{i.unit}</span></>}</td>
                    <td className="r a-muted">{qty(i.alert_threshold)}</td>
                    <td className="r">{i.purchase_price_cents != null ? euros(i.purchase_price_cents) : <span className="a-muted">—</span>}</td>
                    <td className="r">{i.sale_price_cents != null ? euros(i.sale_price_cents) : <span className="a-muted">—</span>}</td>
                    <td className="r">{m != null ? <>{euros(m)} <span className="a-muted">({saleHt ? pct((m / saleHt) * 100) : "—"})</span></> : <span className="a-muted">—</span>}</td>
                    <td className="r">{i.purchase_price_cents != null ? euros(i.purchase_price_cents * Number(i.quantity)) : <span className="a-muted">—</span>}</td>
                    <td className="actions">
                      {canEdit ? <>
                        <button className="a-btn sm" onClick={() => move(i)}>± Mouvement</button>
                        <button className="a-icon" aria-label={`Modifier ${i.name}`} onClick={() => setEditing(i)}>{Icon.pencil}</button>
                        <button className="a-icon danger" aria-label={`Supprimer ${i.name}`} onClick={async () => { if (confirm(`Supprimer « ${i.name} » du stock ?`)) toast.show(await deleteStockItem(i.id)); }}>{Icon.trash}</button>
                      </> : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : <p className="a-empty">Aucun produit{q || onlyLow || section !== "all" ? " ne correspond aux filtres" : " pour l'instant. Ajoutez votre premier produit."}</p>}
      </section>

      <Drawer open={!!editing} title={editing === "new" ? "Ajouter un produit au stock" : "Modifier le produit"} onClose={() => setEditing(null)}>
        {editing ? <StockForm key={editing === "new" ? "new" : editing.id} item={editing === "new" ? null : editing} defaultSection={section !== "all" ? section : "sec"} onDone={() => setEditing(null)} /> : null}
      </Drawer>
      {toast.node}
    </>
  );
}

function StockForm({ item, defaultSection, onDone }: { item: StockItem | null; defaultSection: string; onDone: () => void }) {
  const [state, action, pending] = useActionState<Result | null, FormData>(saveStockItem, null);
  const [buy, setBuy] = useState(centsToInput(item?.purchase_price_cents));
  const [sell, setSell] = useState(centsToInput(item?.sale_price_cents));
  const [vat, setVat] = useState(String(item?.vat_rate ?? 5.5));
  useEffect(() => { if (state?.ok) onDone(); }, [state, onDone]);

  const calc = useMemo(() => {
    const b = buy ? Math.round(Number(buy.replace(",", ".")) * 100) : null;
    const s = sell ? Math.round(Number(sell.replace(",", ".")) * 100) : null;
    if (b == null || !Number.isFinite(b)) return null;
    const buyTtc = Math.round(b * (1 + Number(vat) / 100));
    const saleHt = s != null && Number.isFinite(s) ? htFromTtc(s, Number(vat)) : null;
    return { buyTtc, margin: saleHt != null ? saleHt - b : null, saleHt, coef: s && b ? s / b : null };
  }, [buy, sell, vat]);

  return (
    <form action={action} className="a-form">
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <Field label="Nom du produit" htmlFor="s-name" span><input id="s-name" name="name" defaultValue={item?.name} required /></Field>
      <Field label="Rayon" htmlFor="s-sec"><select id="s-sec" name="section" defaultValue={item?.section ?? defaultSection}>{SECTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
      <Field label="Fournisseur" htmlFor="s-sup"><input id="s-sup" name="supplier" defaultValue={item?.supplier ?? ""} placeholder="Facultatif" /></Field>
      <h3>Quantités</h3>
      <Field label="Unité" htmlFor="s-unit"><input id="s-unit" name="unit" defaultValue={item?.unit ?? "pièce"} placeholder="pièce, kg, litre…" /></Field>
      <Field label="Quantité en stock" htmlFor="s-qty"><input id="s-qty" name="quantity" inputMode="decimal" defaultValue={item ? qty(item.quantity) : ""} placeholder="0" /></Field>
      <Field label="Seuil d'alerte" htmlFor="s-alert" hint="En dessous, le produit passe « à recommander »."><input id="s-alert" name="alert_threshold" inputMode="decimal" defaultValue={item ? qty(item.alert_threshold) : ""} placeholder="0" /></Field>
      <h3>Prix</h3>
      <Field label="Prix d'achat HT / unité (€)" htmlFor="s-buy"><input id="s-buy" name="purchase_price" inputMode="decimal" value={buy} onChange={(e) => setBuy(e.target.value)} placeholder="ex. 1,20" /></Field>
      <Field label="TVA" htmlFor="s-vat"><select id="s-vat" name="vat_rate" value={vat} onChange={(e) => setVat(e.target.value)}>{VAT.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
      <Field label="Prix de vente TTC (€)" htmlFor="s-sell" hint="Si le produit est vendu à l'épicerie."><input id="s-sell" name="sale_price" inputMode="decimal" value={sell} onChange={(e) => setSell(e.target.value)} placeholder="ex. 2,50" /></Field>
      {calc ? (
        <div className="a-calc" aria-live="polite">
          <div>Achat TTC<strong>{euros(calc.buyTtc)}</strong></div>
          <div>Marge HT / unité<strong>{calc.margin != null ? euros(calc.margin) : "—"}</strong></div>
          <div>Coefficient<strong>{calc.coef ? `× ${calc.coef.toLocaleString("fr-FR", { maximumFractionDigits: 2 })}` : "—"}</strong></div>
        </div>
      ) : null}
      <Flash result={state} />
      <div className="a-form-actions"><button type="button" className="a-btn" onClick={onDone}>Annuler</button><button className="a-btn primary" disabled={pending}>{pending ? "Enregistrement…" : item ? "Enregistrer" : "Ajouter au stock"}</button></div>
    </form>
  );
}
