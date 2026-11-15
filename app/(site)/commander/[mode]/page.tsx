import { notFound, redirect } from "next/navigation";
import OrderForm from "@/components/OrderForm";
import { getMenu } from "@/lib/menu";
import { getSettings } from "@/lib/settings";
import { supabaseServer } from "@/lib/supabase/server";
import { isMode, MODES } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CommanderMode({ params }: { params: Promise<{ mode: string }> }) {
  const { mode } = await params;
  if (!isMode(mode)) notFound();
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?suite=/commander/${mode}`);

  const [settings, menu, { data: profile }] = await Promise.all([
    getSettings(),
    getMenu(),
    supabase.from("profiles").select("mobilhome").eq("id", user.id).maybeSingle(),
  ]);

  return (
    <section>
      <div className="wrap stack" style={{ gap: 24 }}>
        <div className="stack" style={{ gap: 8 }}>
          <p className="kick">Commander · {MODES[mode].label}</p>
          <h1 className="disp" style={{ fontSize: "clamp(36px, 5vw, 56px)" }}>Composez votre commande</h1>
        </div>
        {settings.ordering_open ? (
          <OrderForm
            mode={mode}
            defaultLocation={mode === "mobilhome" ? profile?.mobilhome ?? "" : ""}
            menu={menu.map((c) => ({ id: c.id, name: c.name, items: c.items.filter((i) => i.available).map((i) => ({ id: i.id, name: i.name, description: i.description, price_cents: i.price_cents })) }))}
          />
        ) : (
          <p className="card">La commande en ligne ouvrira avec le restaurant. À très vite !</p>
        )}
      </div>
    </section>
  );
}
