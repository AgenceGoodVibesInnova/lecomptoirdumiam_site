import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Button, Pill } from "../../components/ui";
import { useCart } from "../../lib/cart";
import { dateCourte, euros, MODES, STATUTS, type Status } from "../../lib/format";
import { reorder, statusTone, type Order } from "../../lib/orders";
import { supabase } from "../../lib/supabase";
import { C, F, S } from "../../lib/theme";

const STEPS: Status[] = ["nouvelle", "en_preparation", "prete", "terminee"];

/** Suivi de commande en direct. */
export default function Commande() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [o, setO] = useState<Order | null>(null);
  const cart = useCart();

  const load = useCallback(async () => {
    const { data } = await supabase.from("orders").select("id, number, mode, location, status, total_cents, created_at, paid_at, note, is_demo, order_items(menu_item_id, name, quantity, unit_price_cents)").eq("id", id).maybeSingle();
    setO(data as Order | null);
  }, [id]);

  useEffect(() => {
    load(); // eslint-disable-line react-hooks/set-state-in-effect -- requête réseau : l'état change après la réponse
    const ch = supabase.channel(`commande-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, () => load())
      .subscribe();
    const t = setInterval(load, 20000); // filet de sécurité si le direct est coupé
    return () => { supabase.removeChannel(ch); clearInterval(t); };
  }, [id, load]);

  if (!o) return <ActivityIndicator style={{ marginTop: 40 }} color={C.encre} />;
  const step = STEPS.indexOf(o.status);
  const readyText = o.mode === "mobilhome" ? "Elle part vers votre mobil-home !" : o.mode === "table" ? "Elle arrive à votre table !" : "Venez la retirer au comptoir !";

  return (
    <ScrollView contentContainerStyle={[S.pad, { paddingBottom: 40 }]}>
      <View style={S.cardDark}>
        <Text style={[S.kick, { color: C.eclair }]}>Commande n° {o.number}{o.is_demo ? " · essai" : ""}</Text>
        <Text style={[S.h1, { color: C.papier, fontSize: 32 }]}>
          {o.status === "prete" ? "C'est prêt !" : o.status === "terminee" ? "Bon appétit !" : o.status === "annulee" ? "Commande annulée" : "C'est parti !"}
        </Text>
        <Text style={[S.body, { color: C.sable2 }]}>
          {o.status === "prete" ? readyText : o.status === "en_preparation" ? "La cuisine s'en occupe." : o.status === "nouvelle" ? "Votre commande est bien reçue en cuisine." : `${MODES[o.mode].label}${o.location ? ` · ${o.location}` : ""}`}
        </Text>
      </View>

      {o.status !== "annulee" ? (
        <View style={[S.card, { gap: 14 }]} accessibilityLabel={`Statut : ${STATUTS[o.status]}`}>
          {STEPS.map((s, i) => (
            <View key={s} style={S.row}>
              <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: C.encre, backgroundColor: i <= step ? (i === step ? C.eclair : C.encre) : "transparent" }} />
              <Text style={[S.body, { fontFamily: i === step ? F.bodyBold : F.body, color: i <= step ? C.encre : C.gris }]}>{STATUTS[s]}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={S.card}>
        <View style={[S.row, { justifyContent: "space-between" }]}>
          <Text style={S.h3}>Détail</Text>
          <Pill label={STATUTS[o.status]} tone={statusTone(o.status)} />
        </View>
        <Text style={S.muted}>{dateCourte(o.created_at)} · {MODES[o.mode].label}{o.location ? ` · ${o.location}` : ""}</Text>
        {o.order_items.map((i, k) => (
          <View key={k} style={[S.row, { justifyContent: "space-between" }]}>
            <Text style={[S.body, { flex: 1 }]}>{i.quantity} × {i.name}</Text>
            <Text style={S.body}>{euros(i.unit_price_cents * i.quantity)}</Text>
          </View>
        ))}
        {o.note ? <Text style={S.muted}>Remarque : {o.note}</Text> : null}
        <View style={[S.row, { justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.sable3, paddingTop: 8 }]}>
          <Text style={S.h3}>Total</Text><Text style={S.h3}>{euros(o.total_cents)}</Text>
        </View>
      </View>
      {["terminee", "prete"].includes(o.status) ? <Button kind="yellow" label="Recommander la même chose" onPress={() => reorder(o, cart)} /> : null}
    </ScrollView>
  );
}
