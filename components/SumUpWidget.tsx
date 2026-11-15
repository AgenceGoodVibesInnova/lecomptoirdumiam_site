"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    SumUpCard?: { mount: (opts: Record<string, unknown>) => { unmount?: () => void } };
  }
}

const SDK = "https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js";

export default function SumUpWidget({ orderId, checkoutId }: { orderId: string; checkoutId: string }) {
  const router = useRouter();
  const mounted = useRef(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    async function verify() {
      setMsg("Vérification du paiement…");
      const res = await fetch(`/api/orders/${orderId}/verify`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.status === "nouvelle") router.replace(`/commande/${orderId}`);
      else setMsg("Le paiement n'a pas abouti. Vous pouvez réessayer.");
    }

    function mount() {
      window.SumUpCard?.mount({
        id: "sumup-card",
        checkoutId,
        locale: "fr-FR",
        onResponse: (type: string) => {
          if (type === "success") verify();
          else if (type === "error") setMsg("Le paiement a été refusé. Vérifiez votre carte et réessayez.");
        },
      });
    }

    if (window.SumUpCard) return mount();
    const s = document.createElement("script");
    s.src = SDK;
    s.onload = mount;
    s.onerror = () => setMsg("Le module de paiement n'a pas pu se charger. Rechargez la page.");
    document.body.appendChild(s);
  }, [checkoutId, orderId, router]);

  return (
    <div className="stack" style={{ gap: 12 }}>
      <div id="sumup-card" className="card" style={{ minHeight: 280 }} />
      {msg ? <p className="muted" role="status">{msg}</p> : null}
    </div>
  );
}
