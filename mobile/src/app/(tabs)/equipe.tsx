import { dialog } from "../../lib/dialog";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { Button, Empty, Pill } from "../../components/ui";
import { api } from "../../lib/api";
import { euros, heure, MODES, type Mode, type Status } from "../../lib/format";
import { useSession } from "../../lib/session";
import { supabase } from "../../lib/supabase";
import { C, F, S } from "../../lib/theme";

type StaffOrder = {
  id: string; number: number; mode: Mode; location: string | null; note: string | null; status: Status; total_cents: number;
  paid_at: string | null; payment_method: string | null; source: string; customer_name: string | null; created_at: string;
  sms_ready_sent_at: string | null; is_demo: boolean; order_items: { name: string; quantity: number }[];
};

const COLS: { status: Status; title: string; next?: [Status, string] }[] = [
  { status: "nouvelle", title: "Nouvelles", next: ["en_preparation", "Préparer"] },
  { status: "en_preparation", title: "En préparation", next: ["prete", "Prête"] },
  { status: "prete", title: "Prêtes", next: ["terminee", "Servie / retirée"] },
  { status: "terminee", title: "Terminées (3 h)" },
];

/** Espace équipe : commandes en cours, avancement, avis au client, encaissement. */
export default function Equipe() {
  const { me } = useSession();
  const canEdit = me?.staffRole === "admin" || me?.staffRole === "editeur";
  const [orders, setOrders] = useState<StaffOrder[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setOrders((await api<{ orders: StaffOrder[] }>("/api/staff/orders")).orders); }
    catch (e) { setOrders([]); dialog("Espace équipe", (e as Error).message); }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    const ch = supabase.channel("equipe-commandes").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load()).subscribe();
    const t = setInterval(load, 15000);
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [load]);

  const act = async (id: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(id);
    try { const r = (await fn()) as { message?: string }; if (ok || r?.message) dialog("C'est fait", r?.message ?? ok); }
    catch (e) { dialog("Oups", (e as Error).message); }
    setBusy(null);
    load();
  };
  const move = (o: StaffOrder, status: Status) => act(o.id, () => api(`/api/staff/orders/${o.id}`, { method: "PATCH", body: { status } }));
  const notify = (o: StaffOrder) => act(o.id, () => api(`/api/staff/orders/${o.id}/notify`, { method: "POST", body: {} }));
  const cash = (o: StaffOrder) => dialog(`Encaisser n° ${o.number}`, euros(o.total_cents), [
    { text: "Terminal SumUp", onPress: () => act(o.id, () => api(`/api/staff/orders/${o.id}`, { method: "PATCH", body: { payment: "terminal" } }), "Encaissée au terminal.") },
    { text: "Espèces", onPress: () => act(o.id, () => api(`/api/staff/orders/${o.id}`, { method: "PATCH", body: { payment: "especes" } }), "Encaissée en espèces.") },
    { text: "Annuler", style: "cancel" },
  ]);

  return (
    <ScrollView contentContainerStyle={[S.pad, { paddingBottom: 48 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
      {canEdit ? <Button kind="yellow" label="+ Nouvelle commande" onPress={() => router.push("/equipe/nouvelle")} /> : <Text style={S.muted}>Accès en lecture seule.</Text>}
      {orders && !orders.length ? <Empty title="Rien en cours" text="Les commandes en ligne et celles prises à table apparaissent ici en direct." /> : null}
      {COLS.map((c) => {
        const list = (orders ?? []).filter((o) => o.status === c.status);
        if (!list.length) return null;
        return (
          <View key={c.status} style={{ gap: 10 }}>
            <Text style={S.h2}>{c.title} <Text style={{ color: C.gris }}>{list.length}</Text></Text>
            {list.map((o) => (
              <View key={o.id} style={[S.card, c.status === "nouvelle" ? { borderColor: C.encre, borderWidth: 2 } : null]}>
                <View style={[S.row, { justifyContent: "space-between", flexWrap: "wrap" }]}>
                  <Text style={S.h3}>N° {o.number} · {heure(o.created_at)}</Text>
                  <View style={[S.row, { gap: 6 }]}>
                    {o.is_demo ? <Pill label="Essai" tone="yellow" /> : null}
                    {!o.paid_at ? <Pill label="À encaisser" tone="red" /> : null}
                    {o.source === "equipe" ? <Pill label="Sur place" tone="dark" /> : null}
                  </View>
                </View>
                <Text style={[S.body, { fontFamily: F.bodyBold }]}>{MODES[o.mode].label}{o.location ? ` · ${o.location}` : ""}{o.customer_name ? ` · ${o.customer_name}` : ""}</Text>
                {o.order_items.map((i, k) => <Text key={k} style={S.body}>{i.quantity} × {i.name}</Text>)}
                {o.note ? <Text style={[S.body, { color: C.rouge, fontFamily: F.bodyBold }]}>⚠ {o.note}</Text> : null}
                <Text style={S.muted}>{euros(o.total_cents)}{o.sms_ready_sent_at ? ` · client prévenu à ${heure(o.sms_ready_sent_at)}` : ""}</Text>
                {canEdit ? (
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {c.next ? <Button small label={c.next[1]} busy={busy === o.id} onPress={() => move(o, c.next![0])} /> : null}
                    {c.status === "prete" ? <Button small kind="yellow" label={o.sms_ready_sent_at ? "Renvoyer l'avis" : "Prévenir le client"} disabled={busy === o.id} onPress={() => notify(o)} /> : null}
                    {!o.paid_at ? <Button small kind="ghost" label="Encaisser" disabled={busy === o.id} onPress={() => cash(o)} /> : null}
                    {c.status === "nouvelle" ? <Button small kind="ghost" label="Annuler" disabled={busy === o.id} onPress={() => dialog(`Annuler la n° ${o.number} ?`, undefined, [{ text: "Non", style: "cancel" }, { text: "Oui, annuler", style: "destructive", onPress: () => move(o, "annulee") }])} /> : null}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        );
      })}
    </ScrollView>
  );
}
