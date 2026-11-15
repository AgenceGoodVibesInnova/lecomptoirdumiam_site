import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "../lib/session";
import { C } from "../lib/theme";

export default function Start() {
  const { ready, session } = useSession();
  if (!ready) return <View style={{ flex: 1, backgroundColor: C.sable, alignItems: "center", justifyContent: "center" }}><ActivityIndicator color={C.encre} /></View>;
  return <Redirect href={session ? "/(tabs)" : "/connexion"} />;
}
