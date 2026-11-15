"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Carte « À table » : le client indique son numéro de table avant de commander. */
export default function TableCard() {
  const router = useRouter();
  const [table, setTable] = useState("");
  const [err, setErr] = useState("");

  function go(e: React.FormEvent) {
    e.preventDefault();
    const t = table.trim();
    if (!/^[0-9A-Za-z-]{1,6}$/.test(t)) return setErr("Indiquez le numéro inscrit sur votre table.");
    router.push(`/commander/table?t=${encodeURIComponent(t)}`);
  }

  return (
    <form onSubmit={go} className="card stack" style={{ gap: 8, minHeight: 140, justifyContent: "center", border: "2px solid var(--encre)" }}>
      <span className="disp" style={{ fontSize: 28, fontWeight: 600 }}>À table</span>
      <span className="muted">Commandez depuis votre table, on vous sert.</span>
      <div className="row" style={{ gap: 8, flexWrap: "nowrap", marginTop: 4 }}>
        <label htmlFor="table-num" className="lbl" style={{ whiteSpace: "nowrap" }}>N° de table</label>
        <input id="table-num" className="in" inputMode="numeric" autoComplete="off" value={table} onChange={(e) => { setTable(e.target.value); setErr(""); }} placeholder="ex. 7" style={{ maxWidth: 90, minHeight: 42 }} />
        <button className="btn primary small">Continuer →</button>
      </div>
      {err ? <p className="err" role="alert">{err}</p> : <span className="muted" style={{ fontSize: 13 }}>Le numéro est écrit sur votre table. Vous le saisissez à chaque commande.</span>}
    </form>
  );
}
