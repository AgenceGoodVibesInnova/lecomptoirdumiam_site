"use client";
export default function PrintButton() {
  return <button type="button" className="btn primary small" onClick={() => window.print()}>Imprimer / enregistrer en PDF</button>;
}
