// Paiement en ligne SumUp (API « Online Payments »).
// Documentation : https://developer.sumup.com — à vérifier lors de la mise en service.
const API = "https://api.sumup.com/v0.1";

function headers() {
  const key = process.env.SUMUP_API_KEY;
  if (!key) throw new Error("SUMUP_API_KEY manquante");
  return { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
}

export async function createCheckout(opts: { reference: string; amountCents: number; description: string }) {
  const res = await fetch(`${API}/checkouts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      checkout_reference: opts.reference,
      amount: Number((opts.amountCents / 100).toFixed(2)),
      currency: "EUR",
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      description: opts.description,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`SumUp : création du paiement refusée (${res.status}) ${await res.text()}`);
  return (await res.json()) as { id: string; status: string };
}

export async function getCheckout(id: string) {
  const res = await fetch(`${API}/checkouts/${encodeURIComponent(id)}`, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`SumUp : lecture du paiement impossible (${res.status})`);
  return (await res.json()) as { id: string; status: "PENDING" | "PAID" | "FAILED" | string; amount: number };
}
