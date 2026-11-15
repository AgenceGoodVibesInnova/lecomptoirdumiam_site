import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MenuList } from "../../components/MenuList";
import { Field } from "../../components/ui";
import { useCart } from "../../lib/cart";
import { euros, MODES, type Mode } from "../../lib/format";
import { useMenu } from "../../lib/menu";
import { C, F, S } from "../../lib/theme";

export default function Commander() {
  const { mode } = useLocalSearchParams<{ mode: Mode }>();
  const m = (MODES[mode] ? mode : "emporter") as Mode;
  const cart = useCart();
  const { menu, loading, error } = useMenu();
  const insets = useSafeAreaInsets();
  useEffect(() => { if (cart.mode !== m) cart.start(m); }, [m]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <KeyboardAvoidingView style={S.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Stack.Screen options={{ title: MODES[m].label.toUpperCase() }} />
      <ScrollView contentContainerStyle={[S.pad, { paddingBottom: 130 }]} keyboardShouldPersistTaps="handled">
        <Field label={MODES[m].lieu} value={cart.location} onChangeText={cart.setLocation} placeholder={MODES[m].aide}
          keyboardType={m === "emporter" ? "numbers-and-punctuation" : "default"}
          hint={m === "table" ? "Le numéro est sur votre table. Il peut changer d'un repas à l'autre." : undefined} />
        {loading ? <ActivityIndicator color={C.encre} style={{ marginTop: 30 }} /> : null}
        {error ? <Text style={S.err}>{error}</Text> : null}
        <MenuList menu={menu} qty={cart.qty} onChange={cart.add} />
      </ScrollView>
      {cart.count ? (
        <View style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 12 }}>
          <Pressable onPress={() => router.push("/panier")} accessibilityRole="button" accessibilityLabel={`Voir le panier, ${cart.count} articles, ${euros(cart.total)}`}
            style={({ pressed }) => [S.row, { backgroundColor: C.encre, borderRadius: 999, paddingVertical: 16, paddingHorizontal: 22, justifyContent: "space-between", opacity: pressed ? 0.85 : 1, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 }]}>
            <View style={{ backgroundColor: C.eclair, borderRadius: 999, minWidth: 30, height: 30, alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }}>
              <Text style={{ fontFamily: F.bodyBold, color: C.encre }}>{cart.count}</Text>
            </View>
            <Text style={{ color: C.papier, fontFamily: F.display, textTransform: "uppercase", fontSize: 18, letterSpacing: 1 }}>Voir le panier</Text>
            <Text style={{ color: C.papier, fontFamily: F.bodyBold, fontSize: 17 }}>{euros(cart.total)}</Text>
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
