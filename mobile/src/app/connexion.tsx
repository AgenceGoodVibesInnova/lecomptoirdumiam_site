import { router } from "expo-router";
import { useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Field } from "../components/ui";
import { api } from "../lib/api";
import { supabase } from "../lib/supabase";
import { C, F, S } from "../lib/theme";

type Tab = "login" | "signup" | "forgot";

export default function Connexion() {
  const [tab, setTab] = useState<Tab>("login");
  const [f, setF] = useState({ email: "", password: "", first_name: "", last_name: "", phone: "", postal_code: "", mobilhome: "" });
  const [camping, setCamping] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));

  async function submit() {
    setError(""); setInfo("");
    if (!f.email.trim()) return setError("Indiquez votre e-mail.");
    setBusy(true);
    try {
      if (tab === "login") {
        const { error: e } = await supabase.auth.signInWithPassword({ email: f.email.trim().toLowerCase(), password: f.password });
        if (e) throw new Error(/confirm/i.test(e.message) ? "Confirmez d'abord votre adresse e-mail (lien reçu par e-mail)." : "E-mail ou mot de passe incorrect.");
        router.replace("/(tabs)");
      } else if (tab === "signup") {
        if (!f.first_name.trim()) throw new Error("Indiquez votre prénom.");
        if (f.password.length < 8) throw new Error("Le mot de passe doit faire au moins 8 caractères.");
        await api("/api/auth/signup", { body: { ...f, email: f.email.trim(), on_camping: camping, mobilhome: camping ? f.mobilhome : null } });
        setInfo("Compte créé ! Ouvrez l'e-mail que nous venons d'envoyer pour confirmer votre adresse, puis connectez-vous ici.");
        setTab("login");
      } else {
        await api("/api/auth/reset", { body: { email: f.email.trim() } });
        setInfo("Si un compte existe pour cette adresse, un e-mail vient de partir pour choisir un nouveau mot de passe.");
        setTab("login");
      }
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <SafeAreaView style={S.screen} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={[S.pad, { paddingBottom: 48 }]} keyboardShouldPersistTaps="handled">
          <Image source={require("../../assets/icon.png")} style={{ width: 150, height: 150, alignSelf: "center", borderRadius: 30 }} accessibilityLabel="Le Comptoir du Miam" />
          <Text style={[S.h1, { textAlign: "center" }]}>{tab === "signup" ? "Créer un compte" : tab === "forgot" ? "Mot de passe oublié" : "Bon retour !"}</Text>
          <View style={{ flexDirection: "row", backgroundColor: C.sable2, borderRadius: 999, padding: 4 }} accessibilityRole="tablist">
            {(["login", "signup"] as const).map((t) => (
              <Pressable key={t} accessibilityRole="tab" accessibilityState={{ selected: tab === t }} onPress={() => { setTab(t); setError(""); }}
                style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: tab === t ? C.encre : "transparent", alignItems: "center" }}>
                <Text style={{ fontFamily: F.display, textTransform: "uppercase", color: tab === t ? C.papier : C.encre, letterSpacing: 1 }}>{t === "login" ? "Se connecter" : "Créer un compte"}</Text>
              </Pressable>
            ))}
          </View>

          {tab === "signup" ? (
            <>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <View style={{ flex: 1 }}><Field label="Prénom" value={f.first_name} onChangeText={set("first_name")} autoComplete="given-name" textContentType="givenName" /></View>
                <View style={{ flex: 1 }}><Field label="Nom" value={f.last_name} onChangeText={set("last_name")} autoComplete="family-name" textContentType="familyName" /></View>
              </View>
              <Field label="Téléphone mobile" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" placeholder="06 12 34 56 78" />
              <Field label="Code postal de résidence" value={f.postal_code} onChangeText={set("postal_code")} keyboardType="number-pad" autoComplete="postal-code" />
              <View style={[S.card, S.row, { justifyContent: "space-between" }]}>
                <Text style={[S.body, { flex: 1 }]}>Je suis en vacances au camping La Dune des Sables</Text>
                <Switch value={camping} onValueChange={setCamping} trackColor={{ true: C.olive, false: C.sable3 }} accessibilityLabel="En vacances au camping" />
              </View>
              {camping ? <Field label="N° de mobil-home" value={f.mobilhome} onChangeText={set("mobilhome")} placeholder="ex. 42" /> : null}
            </>
          ) : null}

          <Field label="E-mail" value={f.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" />
          {tab !== "forgot" ? (
            <Field label="Mot de passe" value={f.password} onChangeText={set("password")} password autoComplete={tab === "signup" ? "new-password" : "current-password"} textContentType={tab === "signup" ? "newPassword" : "password"} hint={tab === "signup" ? "8 caractères minimum." : undefined} />
          ) : null}

          {error ? <Text style={S.err} accessibilityRole="alert">{error}</Text> : null}
          {info ? <View style={[S.card, { backgroundColor: "#f6f5c2", borderColor: "#d8d55a" }]}><Text style={S.body}>{info}</Text></View> : null}
          <Button label={tab === "login" ? "Se connecter" : tab === "signup" ? "Créer mon compte" : "Recevoir le lien"} onPress={submit} busy={busy} />
          {tab === "login" ? <Button kind="ghost" label="Mot de passe oublié ?" onPress={() => { setTab("forgot"); setError(""); }} /> : null}
          {tab === "forgot" ? <Button kind="ghost" label="Retour à la connexion" onPress={() => setTab("login")} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
