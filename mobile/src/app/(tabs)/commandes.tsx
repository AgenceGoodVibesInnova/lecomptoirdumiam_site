import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { Button, Empty, Pill } from "../../components/ui";
import { useCart } from "../../lib/cart";
import { dateCourte, euros, MODES, STATUTS } from "../../lib/format";
import { myOrders, reorder, statusTone, type Order } from "../../lib/orders";
import { useSession } from "../../lib/session";
import { S } from "../../lib/theme";

export default function Commandes() {
  const [list, setList] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const cart = useCart();
  const { me } = useSession();
  const load = useCallback(async () => setList(await myOrders()), []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <FlatList
      data={list ?? []}
      keyExtractor={(o) => o.id}
      contentContainerStyle={[S.pad, { paddingBottom: 40 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      ListEmptyComponent={list ? <Empty title="Pas encore de commande" text="Vos commandes apparaîtront ici, avec un bouton pour les recommander en un geste." /> : undefined}
      renderItem={({ item: o }) => (
        <Pressable onPress={() => router.push({ pathname: "/commande/[id]", params: { id: o.id } })} accessibilityRole="button" style={S.card}>
          <View style={[S.row, { justifyContent: "space-between" }]}>
            <Text style={S.h3}>N° {o.number}</Text>
            <Pill label={STATUTS[o.status]} tone={statusTone(o.status)} />
          </View>
          <Text style={S.muted}>{dateCourte(o.created_at)} · {MODES[o.mode].label}</Text>
          <Text style={S.body} numberOfLines={2}>{o.order_items.filter((i) => i.menu_item_id).map((i) => `${i.quantity} × ${i.name}`).join(", ")}</Text>
          <View style={[S.row, { justifyContent: "space-between" }]}>
            <Text style={[S.body, { fontFamily: "Barlow_600SemiBold" }]}>{euros(o.total_cents)}</Text>
            <Button small kind="yellow" label="Recommander" disabled={!me?.canOrder} onPress={() => reorder(o, cart)} />
          </View>
        </Pressable>
      )}
    />
  );
}
