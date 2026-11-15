"use client";
import { useState, useTransition } from "react";
import { cashOrder, notifyReady, sendInvoice, setOrderStatus } from "@/app/admin/actions";
import { Icon, useToast } from "./ui";
import { STATUTS } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const FLOW: OrderStatus[] = ["nouvelle", "en_preparation", "prete", "terminee"];

export default function OrderActions({ id, status, canEdit, hasEmail, paid }: { id: string; status: OrderStatus; canEdit: boolean; hasEmail: boolean; paid: boolean }) {
  const [pending, start] = useTransition();
  const [current, setCurrent] = useState(status);
  const toast = useToast();
  const set = (s: OrderStatus) => start(async () => { const r = await setOrderStatus(id, s); if (r.ok) setCurrent(s); toast.show(r.ok ? { ok: true, message: `Statut : ${STATUTS[s]}` } : r); });

  return (
    <section className="a-card a-card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2>Actions</h2>
      {canEdit ? (
        <div className="a-tabs" role="group" aria-label="Statut de la commande">
          {[...FLOW, "annulee" as OrderStatus].map((s) => <button key={s} aria-pressed={current === s} disabled={pending} onClick={() => set(s)}>{STATUTS[s]}</button>)}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {canEdit && !paid ? <>
          <button className="a-btn primary" disabled={pending} onClick={() => start(async () => { toast.show(await cashOrder(id, "terminal")); })}>Encaissée au terminal</button>
          <button className="a-btn" disabled={pending} onClick={() => start(async () => { toast.show(await cashOrder(id, "especes")); })}>Encaissée en espèces</button>
        </> : null}
        {canEdit ? <button className="a-btn" disabled={pending} onClick={() => start(async () => { const r = await notifyReady(id); if (r.ok) setCurrent((c) => (c === "nouvelle" || c === "en_preparation" ? "prete" : c)); toast.show(r); })}>Prévenir le client (prête)</button> : null}
        {paid ? <a className="a-btn" href={`/facture/${id}`} target="_blank" rel="noreferrer">{Icon.doc} Voir la facture</a> : null}
        {canEdit && paid ? (
          <button className="a-btn primary" disabled={pending || !hasEmail} title={hasEmail ? undefined : "Aucune adresse e-mail pour ce client"}
            onClick={() => start(async () => toast.show(await sendInvoice(id)))}>{Icon.mail} Envoyer la facture par e-mail</button>
        ) : null}
      </div>
      {!hasEmail && paid ? <p className="a-hint" style={{ margin: 0 }}>Pas d'e-mail connu pour ce client : ouvrez la facture et imprimez-la.</p> : null}
      {toast.node}
    </section>
  );
}
