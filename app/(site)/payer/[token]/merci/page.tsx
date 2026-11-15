export const metadata = { title: "Paiement reçu", robots: { index: false } };

/** Fin du paiement par lien : l'application ferme cette page dès qu'elle l'atteint. */
export default function Merci() {
  return (
    <section>
      <div className="wrap stack" style={{ maxWidth: 560, gap: 16, textAlign: "center" }}>
        <h1 className="disp" style={{ fontSize: 44 }}>Paiement reçu</h1>
        <p className="muted">Merci ! Votre commande part en cuisine. Vous pouvez revenir à l'application.</p>
      </div>
    </section>
  );
}
