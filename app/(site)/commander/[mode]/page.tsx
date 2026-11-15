import { notFound, redirect } from "next/navigation";
import OrderForm from "@/components/OrderForm";
import { getMenu } from "@/lib/menu";
import { getSettings } from "@/lib/settings";
import { supabaseServer } from "@/lib/supabase/server";
import { isMode, MODES } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CommanderMode({ params, searchParams }: { params: Promise<{ mode: string }>; searchParams: Promise<{ t?: string }> }) {
  const { mode } = await params;
  const { t } = await searchParams;
  const table = mode === "table" && t && /^[0-9A-Za-z-]{1,6}$/.test(t) ? t : "";
  if (!isMode(mode)) notFound();
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/connexion?suite=${encodeURIComponent(`/commander/${mode}${table ? `?t=${table}` : ""}`)}`);

  const [settings, menu, { data: profile }, { data: staff }] = await Promise.all([
    getSettings(),
    getMenu(),
    supabase.from("profiles").select("mobilhome, phone").eq("id", user.id).maybeSingle(),
    supabase.from("staff").select("role").eq("user_id", user.id).maybeSingle(),
  ]);
  // L'équipe peut tester la commande même quand elle est fermée au public.
  const preview = !settings.ordering_open && !!staff;

  return (
    <section>
      <div className="wrap stack" style={{ gap: 24 }}>
        <div className="stack" style={{ gap: 8 }}>
          <p className="kick">Commander · {MODES[mode].label}{table ? ` · table ${table}` : ""}</p>
          <h1 className="disp" style={{ fontSize: "clamp(36px, 5vw, 56px)" }}>Composez votre commande</h1>
        </div>
        {preview ? (
          <p className="card" style={{ background: "#f6f5c2", borderColor: "#d8d55a", margin: 0 }}>
            <strong>Aperçu équipe</strong> · la commande en ligne est fermée au public (Admin › Réglages). Vous la voyez parce que vous faites partie de l'équipe.
          </p>
        ) : null}
        {settings.ordering_open || preview ? (
          <OrderForm
            mode={mode}
            defaultLocation={mode === "mobilhome" ? profile?.mobilhome ?? "" : table}
            defaultPhone={profile?.phone ?? ""}
            menu={menu.map((c) => ({ id: c.id, name: c.name, items: c.items.filter((i) => i.available).map((i) => ({ id: i.id, name: i.name, description: i.description, price_cents: i.price_cents })) }))}
          />
        ) : (
          <p className="card">La commande en ligne ouvrira avec le restaurant. À très vite !</p>
        )}
      </div>
    </section>
  );
}
