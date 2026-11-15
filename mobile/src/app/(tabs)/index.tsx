import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Pill, Stamps } from "../../components/ui";
import { useCart } from "../../lib/cart";
import { euros, MODES, STATUTS, type Mode } from "../../lib/format";
import { myOrders, reorder, statusTone, type Order } from "../../lib/orders";
import { useSession } from "../../lib/session";
import { C, F, S } from "../../lib/theme";

export default function Accueil() {
  const { me, refreshMe } = useSession();
  const cart = useCart();
  const [last, setLast] = useState<Order | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [orders] = await Promise.all([myOrders(1), refreshMe()]);
    setLast(orders[0] ?? null);
  }, [refreshMe]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const go = (m: Mode) => {
    cart.start(m, m === "mobilhome" ? me?.profile?.mobilhome ?? "" : "");
    router.push({ pathname: "/commander/[mode]", params: { mode: m } });
  };
  const active = last && ["nouvelle", "en_preparation", "prete"].includes(last.status);
  const l = me?.loyalty;

  return (
    <SafeAreaView style={S.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={[S.pad, { paddingBottom: 40 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
        <View style={S.cardDark}>
          <Text style={[S.kick, { color: C.eclair }]}>Le Comptoir du Miam</Text>
          <Text style={[S.h1, { color: C.papier }]}>Bonjour{me?.profile?.first_name ? ` ${me.profile.first_name}` : ""} !</Text>
          <Text style={[S.muted, { color: C.sable2 }]}>Brunch · Snack · Restaurant · Épicerie</Text>
        </View>

        {me && !me.canOrder ? (
          <View style={[S.card, { backgroundColor: "#f6f5c2", borderColor: "#d8d55a" }]}>
            <Text style={S.body}>{me.settings?.opening_label ?? "La commande en ligne ouvrira avec le restaurant."} À très vite !</Text>
          </View>
        ) : null}
        {me?.staffPreview ? (
          <View style={[S.card, { backgroundColor: "#f6f5c2", borderColor: "#d8d55a" }]}>
            <Text style={S.body}><Text style={{ fontFamily: F.bodyBold }}>Aperçu équipe</Text> · la commande est fermée au public, vous pouvez la tester. Le paiement est simulé tant que SumUp n'est pas branché.</Text>
          </View>
        ) : null}

        {active && last ? (
          <Pressable onPress={() => router.push({ pathname: "/commande/[id]", params: { id: last.id } })} accessibilityRole="button"
            style={[S.card, { borderWidth: 2, borderColor: C.encre }]}>
            <View style={[S.row, { justifyContent: "space-between" }]}>
              <Text style={S.h3}>Commande n° {last.number}</Text>
              <Pill label={STATUTS[last.status]} tone={statusTone(last.status)} />
            </View>
            <Text style={S.muted}>Suivre ma commande en direct →</Text>
          </Pressable>
        ) : null}

        <Text style={S.h2}>Commander</Text>
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <Pressable key={m} disabled={!me?.canOrder} onPress={() => go(m)} accessibilityRole="button" accessibilityLabel={`Commander ${MODES[m].label}`}
            style={({ pressed }) => [S.card, S.row, { justifyContent: "space-between", opacity: me?.canOrder ? (pressed ? 0.8 : 1) : 0.5, borderWidth: 2, borderColor: C.encre }]}>
            <View style={{ gap: 2, flex: 1 }}>
              <Text style={[S.h3, { fontSize: 21 }]}>{MODES[m].label}</Text>
              <Text style={S.muted}>{m === "mobilhome" && me?.profile?.mobilhome ? `Livré au n° ${me.profile.mobilhome}` : MODES[m].detail}</Text>
            </View>
            <Ionicons name="arrow-forward" size={24} color={C.encre} />
          </Pressable>
        ))}

        {last ? (
          <View style={S.card}>
            <Text style={S.h3}>Recommander</Text>
            <Text style={S.muted} numberOfLines={2}>{last.order_items.filter((i) => i.menu_item_id).map((i) => `${i.quantity} × ${i.name}`).join(", ")}</Text>
            <View style={[S.row, { justifyContent: "space-between" }]}>
              <Text style={S.body}>{MODES[last.mode].label} · {euros(last.total_cents)}</Text>
              <Button small kind="yellow" label="Recommander" disabled={!me?.canOrder} onPress={() => reorder(last, cart)} />
            </View>
          </View>
        ) : null}

        {l?.enabled ? (
          <Pressable onPress={() => router.push("/(tabs)/fidelite")} accessibilityRole="button" style={S.card}>
            <View style={[S.row, { justifyContent: "space-between" }]}>
              <Text style={S.h3}>Ma carte de fidélité</Text>
              {l.available ? <Pill label="Récompense dispo !" tone="yellow" /> : <Text style={S.muted}>{l.stamps}/{l.goal}</Text>}
            </View>
            <Stamps stamps={l.stamps} goal={l.goal} size={24} />
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
