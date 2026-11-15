"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { euros } from "@/lib/format";

/** Paiement simulé, affiché tant que SumUp n'est pas branché (équipe uniquement). */
export default function DemoPayment({ orderId, total, payToken, doneUrl }: { orderId: string; total: number; payToken?: string; doneUrl?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function pay() {
    setBusy(true);
    setErr("");
    const res = await fetch(`/api/orders/${orderId}/verify${payToken ? `?k=${payToken}` : ""}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (data.status === "nouvelle") return router.replace(doneUrl ?? `/commande/${orderId}`);
    setBusy(false);
    setErr(data.error ?? "Le paiement simulé n'a pas abouti.");
  }

  return (
    <div className="card stack" style={{ gap: 14 }}>
      <p style={{ margin: 0, padding: "10px 12px", borderRadius: 6, background: "#f6f5c2", border: "1px solid #d8d55a", fontSize: 15 }}>
        <strong>Paiement simulé</strong> · SumUp n'est pas encore branché. Aucune carte n'est demandée et rien n'est débité. La commande suivra ensuite le parcours réel : cuisine, e-mail de confirmation, facture d'essai.
      </p>
      <div aria-hidden="true" style={{ display: "grid", gap: 8, opacity: 0.55 }}>
        <div className="in" style={{ display: "flex", alignItems: "center" }}>4242 4242 4242 4242</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div className="in" style={{ display: "flex", alignItems: "center" }}>12 / 30</div>
          <div className="in" style={{ display: "flex", alignItems: "center" }}>123</div>
        </div>
      </div>
      {err ? <p className="err" role="alert">{err}</p> : null}
      <button type="button" className="btn primary" onClick={pay} disabled={busy}>{busy ? "Paiement en cours…" : `Simuler le paiement de ${euros(total)}`}</button>
    </div>
  );
}
