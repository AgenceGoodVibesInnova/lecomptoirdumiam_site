import { Antonio_600SemiBold, Antonio_700Bold, useFonts } from "@expo-google-fonts/antonio";
import { Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold } from "@expo-google-fonts/barlow";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { CartProvider } from "../lib/cart";
import { SessionProvider } from "../lib/session";
import { C, F } from "../lib/theme";

export default function RootLayout() {
  const [loaded] = useFonts({ Antonio_600SemiBold, Antonio_700Bold, Barlow_400Regular, Barlow_500Medium, Barlow_600SemiBold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: C.sable, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={C.encre} /></View>;
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{
            headerStyle: { backgroundColor: C.sable },
            headerShadowVisible: false,
            headerTintColor: C.encre,
            headerTitleStyle: { fontFamily: F.display, fontSize: 19 },
            headerBackTitle: "Retour",
            contentStyle: { backgroundColor: C.sable },
          }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="connexion" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="commander/[mode]" options={{ title: "COMMANDER" }} />
            <Stack.Screen name="panier" options={{ title: "MON PANIER" }} />
            <Stack.Screen name="paiement" options={{ title: "PAIEMENT", presentation: "modal" }} />
            <Stack.Screen name="commande/[id]" options={{ title: "MA COMMANDE" }} />
            <Stack.Screen name="equipe/nouvelle" options={{ title: "NOUVELLE COMMANDE" }} />
          </Stack>
        </CartProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
