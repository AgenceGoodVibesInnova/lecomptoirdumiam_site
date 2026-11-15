import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Switch, Text, View } from "react-native";
import { Button, Empty, Field, Stepper } from "../components/ui";
import { api } from "../lib/api";
import { registerPush } from "../lib/push";
import { useCart } from "../lib/cart";
import { euros, MODES } from "../lib/format";
import { useSession } from "../lib/session";
import { C, F, S } from "../lib/theme";

export default function Panier() {
  const cart = useCart();
  const { me, refreshMe } = useSession();
  const [phone, setPhone] = useState(me?.profile?.phone ?? "");
  const [note, setNote] = useState("");
  const [useReward, setUseReward] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reward = me?.loyalty.enabled && me.loyalty.available > 0 ? me.loyalty : null;
  const discount = useReward && reward ? Math.min(reward.rewardCents, cart.total) : 0;

  if (!cart.mode || !cart.lines.length) {
    return <View style={S.pad}><Empty title="Panier vide" text="Ajoutez des plats depuis la carte." action={<Button label="Voir la carte" onPress={() => router.back()} />} /></View>;
  }
  const mode = cart.mode;

  async function pay() {
    setError("");
    if (!cart.location.trim()) return setError(`Indiquez : ${MODES[mode].lieu.toLowerCase()}.`);
    setBusy(true);
    try {
      const r = await api<{ id: string; pay_url: string; paid?: boolean }>("/api/orders", {
        body: { mode, location: cart.location, note, phone, use_reward: useReward, items: cart.lines.map((l) => ({ id: l.id, qty: l.qty })) },
      });
      cart.clear();
      registerPush().catch(() => {}); // propose les notifications « commande prête » après la 1re commande
      if (r.paid) {
        refreshMe();
        router.dismissAll();
        router.push({ pathname: "/commande/[id]", params: { id: r.id } });
      } else {
        router.push({ pathname: "/paiement", params: { url: r.pay_url, id: r.id } });
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <KeyboardAvoidingView style={S.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={[S.pad, { paddingBottom: 40 }]} keyboardShouldPersistTaps="handled">
        <View style={S.card}>
          <Text style={S.kick}>{MODES[mode].label}{cart.location ? ` · ${cart.location}` : ""}</Text>
          {cart.lines.map((l) => (
            <View key={l.id} style={[S.row, { justifyContent: "space-between", paddingVertical: 4 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[S.body, { fontFamily: F.bodyBold }]}>{l.name}</Text>
                <Text style={S.muted}>{euros(l.price_cents * l.qty)}</Text>
              </View>
              <Stepper name={l.name} qty={l.qty} onChange={(d) => cart.add(l, d)} />
            </View>
          ))}
        </View>
        <Field label={MODES[mode].lieu} value={cart.location} onChangeText={cart.setLocation} placeholder={MODES[mode].aide} />
        <Field label="Téléphone mobile" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Pour être prévenu" />
        <Field label="Remarque (allergies, précisions)" value={note} onChangeText={setNote} multiline style={[S.input, { minHeight: 80, textAlignVertical: "top" }]} />
        {reward ? (
          <View style={[S.card, S.row, { backgroundColor: "#f6f5c2", borderColor: "#d8d55a", justifyContent: "space-between" }]}>
            <View style={{ flex: 1 }}>
              <Text style={[S.body, { fontFamily: F.bodyBold }]}>Utiliser ma récompense</Text>
              <Text style={S.muted}>{reward.rewardLabel}</Text>
            </View>
            <Switch value={useReward} onValueChange={setUseReward} trackColor={{ true: C.olive, false: C.sable3 }} accessibilityLabel="Utiliser ma récompense fidélité" />
          </View>
        ) : null}
        <View style={S.card}>
          {discount ? <View style={[S.row, { justifyContent: "space-between" }]}><Text style={S.body}>Fidélité</Text><Text style={S.body}>−{euros(discount)}</Text></View> : null}
          <View style={[S.row, { justifyContent: "space-between" }]}>
            <Text style={S.h3}>Total</Text>
            <Text style={[S.h2, { fontSize: 26 }]}>{euros(cart.total - discount)}</Text>
          </View>
        </View>
        {error ? <Text style={S.err} accessibilityRole="alert">{error}</Text> : null}
        <Button label={cart.total - discount === 0 ? "Valider ma commande" : "Payer ma commande"} onPress={pay} busy={busy} />
        <Text style={[S.muted, { textAlign: "center" }]}>Paiement sécurisé par carte bancaire (SumUp).</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
