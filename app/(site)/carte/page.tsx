import Link from "next/link";
import { getMenu } from "@/lib/menu";
import { euros } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "La carte" };

export default async function Carte() {
  const menu = await getMenu();
  const hasItems = menu.some((c) => c.items.length > 0);
  return (
    <section>
      <div className="wrap stack" style={{ gap: 40 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
          <div className="stack" style={{ gap: 10 }}>
            <p className="kick">La carte</p>
            <h1 className="disp" style={{ fontSize: "clamp(40px, 6vw, 68px)" }}>Du premier café au dernier verre</h1>
          </div>
          <Link href="/commander" className="btn primary">Commander en ligne</Link>
        </div>
        {!hasItems ? <p className="muted">La carte sera publiée avant l'ouverture.</p> : null}
        {menu.filter((c) => c.items.length).map((c) => (
          <div key={c.id} className="stack" style={{ gap: 14 }}>
            <div className="row" style={{ alignItems: "baseline", gap: 16, borderBottom: "3px solid var(--encre)", paddingBottom: 8 }}>
              <h2 className="disp" style={{ fontSize: 36 }}>{c.name}</h2>
              {c.moment ? <span className="kick">{c.moment}</span> : null}
            </div>
            <div className="grid2" style={{ gap: "6px 40px" }}>
              {c.items.map((i) => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 0", borderBottom: "1px solid var(--sable-3)", opacity: i.available ? 1 : 0.5 }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{i.name}{!i.available ? " · épuisé" : ""}</div>
                    {i.description ? <div className="muted" style={{ fontSize: 15 }}>{i.description}</div> : null}
                  </div>
                  <div style={{ fontWeight: 600, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{euros(i.price_cents)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
