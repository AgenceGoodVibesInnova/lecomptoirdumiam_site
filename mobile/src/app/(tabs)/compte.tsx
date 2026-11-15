import { dialog } from "../../lib/dialog";
import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, ScrollView, Switch, Text, View } from "react-native";
import { Button, Field } from "../../components/ui";
import { api } from "../../lib/api";
import { SITE } from "../../lib/config";
import { registerPush } from "../../lib/push";
import { useSession } from "../../lib/session";
import { supabase } from "../../lib/supabase";
import { C, S } from "../../lib/theme";

export default function Compte() {
  const { session, me, refreshMe, signOut } = useSession();
  const p = me?.profile;
  const [f, setF] = useState({ first_name: p?.first_name ?? "", last_name: p?.last_name ?? "", phone: p?.phone ?? "", postal_code: p?.postal_code ?? "", mobilhome: p?.mobilhome ?? "" });
  const [camping, setCamping] = useState(p?.on_camping ?? false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [push, setPush] = useState("");
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));

  async function save() {
    if (!session) return;
    setBusy(true); setMsg("");
    const { error } = await supabase.from("profiles").update({ ...f, on_camping: camping, mobilhome: camping ? f.mobilhome : null }).eq("id", session.user.id);
    setBusy(false);
    setMsg(error ? "Enregistrement impossible. Réessayez." : "Profil enregistré.");
    if (!error) refreshMe();
  }

  function remove() {
    dialog("Supprimer mon compte ?", "Votre compte, vos tampons de fidélité et vos préférences seront supprimés définitivement. Vos factures restent conservées par le restaurant, comme la loi l'exige.", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: async () => {
        try { await api("/api/me", { method: "DELETE" }); await signOut(); router.replace("/connexion"); }
        catch (e) { dialog("Suppression impossible", (e as Error).message); }
      } },
    ]);
  }

  return (
    <KeyboardAvoidingView style={S.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={[S.pad, { paddingBottom: 48 }]} keyboardShouldPersistTaps="handled">
        <Text style={S.muted}>{me?.email}{me?.staffRole ? ` · équipe (${me.staffRole})` : ""}</Text>
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Prénom" value={f.first_name} onChangeText={set("first_name")} /></View>
          <View style={{ flex: 1 }}><Field label="Nom" value={f.last_name} onChangeText={set("last_name")} /></View>
        </View>
        <Field label="Téléphone mobile" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
        <Field label="Code postal" value={f.postal_code} onChangeText={set("postal_code")} keyboardType="number-pad" />
        <View style={[S.card, S.row, { justifyContent: "space-between" }]}>
          <Text style={[S.body, { flex: 1 }]}>En vacances au camping La Dune des Sables</Text>
          <Switch value={camping} onValueChange={setCamping} trackColor={{ true: C.olive, false: C.sable3 }} accessibilityLabel="En vacances au camping" />
        </View>
        {camping ? <Field label="N° de mobil-home" value={f.mobilhome} onChangeText={set("mobilhome")} /> : null}
        {msg ? <Text style={S.muted} accessibilityRole="alert">{msg}</Text> : null}
        <Button label="Enregistrer" onPress={save} busy={busy} />

        <View style={S.card}>
          <Text style={S.h3}>Notifications</Text>
          <Text style={S.muted}>Être prévenu dès que votre commande est prête.</Text>
          <Button small kind="ghost" label="Activer les notifications" onPress={async () => { const r = await registerPush(); setPush(r.ok ? "Notifications activées." : r.reason); }} />
          {push ? <Text style={S.muted}>{push}</Text> : null}
        </View>

        {me?.settings?.instagram_url ? <Button kind="ghost" label="Nous suivre sur Instagram" onPress={() => Linking.openURL(me.settings!.instagram_url!)} /> : null}
        <Button kind="ghost" label="Le site du Miam" onPress={() => Linking.openURL(SITE)} />
        <Button label="Se déconnecter" onPress={async () => { await signOut(); router.replace("/connexion"); }} />
        <Button kind="ghost" label="Supprimer mon compte" onPress={remove} style={{ borderColor: C.rouge }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
