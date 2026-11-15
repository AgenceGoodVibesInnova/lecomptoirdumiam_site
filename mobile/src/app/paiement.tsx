import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import { ActivityIndicator, Linking, Platform, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { Button } from "../components/ui";
import { SITE } from "../lib/config";
import { useSession } from "../lib/session";
import { C, S } from "../lib/theme";

/** Page de paiement du site (SumUp) ouverte dans l'application ; se ferme seule quand le paiement est reçu. */
export default function Paiement() {
  const { url, id } = useLocalSearchParams<{ url: string; id: string }>();
  const { refreshMe } = useSession();
  const done = useRef(false);
  const safe = typeof url === "string" && url.startsWith(`${SITE}/payer/`);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    refreshMe();
    router.dismissAll();
    router.push({ pathname: "/commande/[id]", params: { id } });
  };

  useEffect(() => { if (Platform.OS === "web" && safe) Linking.openURL(url); }, [safe, url]);

  if (!safe) return <View style={S.pad}><Text style={S.err}>Lien de paiement invalide.</Text></View>;
  if (Platform.OS === "web") {
    return <View style={S.pad}><Text style={S.body}>Le paiement s'est ouvert dans un nouvel onglet.</Text><Button label="J'ai payé, voir ma commande" onPress={finish} /></View>;
  }
  return (
    <WebView
      source={{ uri: url }}
      style={{ flex: 1, backgroundColor: C.sable }}
      startInLoadingState
      renderLoading={() => <ActivityIndicator style={{ marginTop: 40 }} color={C.encre} />}
      onNavigationStateChange={(s) => { if (s.url.includes("/merci")) finish(); }}
      onShouldStartLoadWithRequest={(r) => r.url.startsWith(SITE) || r.url.startsWith("https://") }
    />
  );
}
