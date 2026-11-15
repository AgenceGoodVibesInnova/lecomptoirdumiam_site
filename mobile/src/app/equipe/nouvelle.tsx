import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { MenuList } from "../../components/MenuList";
import { Button, Choice, Field } from "../../components/ui";
import { api } from "../../lib/api";
import type { Line } from "../../lib/cart";
import { euros, type Mode } from "../../lib/format";
import { useMenu, type Item } from "../../lib/menu";
import { C, F, S } from "../../lib/theme";

type Pay = "terminal" | "especes" | "plus_tard";

/** Prise de commande par l'équipe, à table ou au comptoir. */
export default function Nouvelle() {
  const { menu, loading } = useMenu();
  const [mode, setMode] = useState<Mode>("table");
  const [location, setLocation] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [note, setNote] = useState("");
  const [client, setClient] = useState({ name: "", email: "", phone: "" });
  const [pay, setPay] = useState<Pay>("plus_tard");
  const [busy, setBusy] = useState(false);
  const total = lines.reduce((s, l) => s + l.price_cents * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);

  const add = (i: Pick<Item, "id" | "name" | "price_cents">, d: number) => setLines((ls) => {
    const cur = ls.find((l) => l.id === i.id);
    if (!cur) return d > 0 ? [...ls, { id: i.id, name: i.name, price_cents: i.price_cents, qty: d }] : ls;
    const q = cur.qty + d;
    return q <= 0 ? ls.filter((l) => l.id !== i.id) : ls.map((l) => (l.id === i.id ? { ...l, qty: q } : l));
  });

  async function send() {
    if (!count) return Alert.alert("Commande vide", "Ajoutez au moins un plat.");
    if (!location.trim()) return Alert.alert(mode === "table" ? "N° de table" : "Repère", mode === "table" ? "Indiquez le numéro de table." : "Indiquez un nom ou un repère pour le retrait.");
    setBusy(true);
    try {
      const r = await api<{ number: number }>("/api/staff/orders", {
        body: { mode, location, note, payment: pay, customer_name: client.name, customer_email: client.email, customer_phone: client.phone, items: lines.map((l) => ({ id: l.id, qty: l.qty })) },
      });
      Alert.alert(`Commande n° ${r.number} envoyée`, pay === "plus_tard" ? "Elle est en cuisine. À encaisser plus tard." : "Elle est en cuisine et encaissée.");
      router.back();
    } catch (e) {
      Alert.alert("Envoi impossible", (e as Error).message);
    }
    setBusy(false);
  }

  return (
    <KeyboardAvoidingView style={S.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={[S.pad, { paddingBottom: 48 }]} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }} accessibilityRole="radiogroup">
          <Choice label="À table" selected={mode === "table"} onPress={() => setMode("table")} />
          <Choice label="Comptoir" detail="À emporter" selected={mode === "emporter"} onPress={() => setMode("emporter")} />
          <Choice label="Mobil-home" selected={mode === "mobilhome"} onPress={() => setMode("mobilhome")} />
        </View>
        <Field label={mode === "table" ? "N° de table" : mode === "mobilhome" ? "N° de mobil-home" : "Nom ou repère"} value={location} onChangeText={setLocation}
          keyboardType={mode === "emporter" ? "default" : "number-pad"} placeholder={mode === "table" ? "ex. 7" : mode === "mobilhome" ? "ex. 42" : "ex. Julie"} />

        {loading ? <ActivityIndicator color={C.encre} /> : <MenuList menu={menu} qty={(id) => lines.find((l) => l.id === id)?.qty ?? 0} onChange={add} />}

        <Field label="Remarque (allergies, cuisson…)" value={note} onChangeText={setNote} multiline style={[S.input, { minHeight: 70, textAlignVertical: "top" }]} />
        <View style={[S.card, { gap: 12 }]}>
          <Text style={S.h3}>Client (facultatif)</Text>
          <Text style={S.muted}>Avec son e-mail de compte, la commande lui donne un tampon de fidélité et il est prévenu quand c'est prêt.</Text>
          <Field label="Prénom ou nom" value={client.name} onChangeText={(v) => setClient((c) => ({ ...c, name: v }))} />
          <Field label="E-mail" value={client.email} onChangeText={(v) => setClient((c) => ({ ...c, email: v }))} keyboardType="email-address" autoCapitalize="none" />
          <Field label="Téléphone" value={client.phone} onChangeText={(v) => setClient((c) => ({ ...c, phone: v }))} keyboardType="phone-pad" />
        </View>
        <Text style={S.label}>Encaissement</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }} accessibilityRole="radiogroup">
          <Choice label="Plus tard" detail="En fin de repas" selected={pay === "plus_tard"} onPress={() => setPay("plus_tard")} />
          <Choice label="Terminal" detail="SumUp, déjà payé" selected={pay === "terminal"} onPress={() => setPay("terminal")} />
          <Choice label="Espèces" detail="Déjà payé" selected={pay === "especes"} onPress={() => setPay("especes")} />
        </View>
        <View style={[S.card, S.row, { justifyContent: "space-between" }]}>
          <Text style={S.h3}>{count} article{count > 1 ? "s" : ""}</Text>
          <Text style={[S.h2, { fontFamily: F.display }]}>{euros(total)}</Text>
        </View>
        <Button label="Envoyer en cuisine" onPress={send} busy={busy} disabled={!count} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
