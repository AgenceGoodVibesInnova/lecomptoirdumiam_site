import Ionicons from "@expo/vector-icons/Ionicons";
import { Redirect, Tabs } from "expo-router";
import { useSession } from "../../lib/session";
import { C, F } from "../../lib/theme";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
function icon(name: IconName) {
  function TabIcon({ color, size }: { color?: unknown; size: number }) {
    return <Ionicons name={name} color={typeof color === "string" ? color : C.encre} size={size} />;
  }
  return TabIcon;
}

export default function TabsLayout() {
  const { ready, session, me } = useSession();
  if (ready && !session) return <Redirect href="/connexion" />;
  const staff = !!me?.staffRole;
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: C.sable },
      headerShadowVisible: false,
      headerTitleStyle: { fontFamily: F.display, fontSize: 20, color: C.encre },
      tabBarActiveTintColor: C.encre,
      tabBarInactiveTintColor: C.gris,
      tabBarStyle: { backgroundColor: C.papier, borderTopColor: C.sable3 },
      tabBarLabelStyle: { fontFamily: F.bodyBold, fontSize: 11 },
      sceneStyle: { backgroundColor: C.sable },
    }}>
      <Tabs.Screen name="index" options={{ title: "Accueil", headerShown: false, tabBarIcon: icon("home") }} />
      <Tabs.Screen name="commandes" options={{ title: "Commandes", headerTitle: "MES COMMANDES", tabBarIcon: icon("receipt") }} />
      <Tabs.Screen name="fidelite" options={{ title: "Fidélité", headerTitle: "MA CARTE DE FIDÉLITÉ", tabBarIcon: icon("flash") }} />
      <Tabs.Screen name="equipe" options={{ title: "Équipe", headerTitle: "ESPACE ÉQUIPE", tabBarIcon: icon("restaurant"), href: staff ? undefined : null }} />
      <Tabs.Screen name="compte" options={{ title: "Compte", headerTitle: "MON COMPTE", tabBarIcon: icon("person") }} />
    </Tabs>
  );
}
