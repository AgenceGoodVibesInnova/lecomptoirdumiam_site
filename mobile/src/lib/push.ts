import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldPlaySound: true, shouldSetBadge: false, shouldShowBanner: true, shouldShowList: true }),
  });
}

/**
 * Demande l'autorisation et enregistre le téléphone auprès du site pour recevoir « Votre commande est prête ».
 * Renvoie un message si ce n'est pas possible (simulateur, refus, application pas encore publiée…).
 */
export async function registerPush(): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (Platform.OS === "web") return { ok: false, reason: "Les notifications fonctionnent dans l'application sur téléphone." };
  if (!Device.isDevice) return { ok: false, reason: "Les notifications demandent un vrai téléphone." };
  if (Platform.OS === "android") {
    // eslint-disable-next-line import/namespace -- exporté par expo-notifications (vérifié par TypeScript)
    await Notifications.setNotificationChannelAsync("default", { name: "Commandes", importance: Notifications.AndroidImportance.MAX });
  }
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return { ok: false, reason: "Notifications refusées. Vous pouvez les autoriser dans les réglages du téléphone." };
  const projectId = (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return { ok: false, reason: "Notifications disponibles dès la publication de l'application." };
  try {
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await api("/api/push", { body: { token, platform: Platform.OS } });
    return { ok: true };
  } catch {
    return { ok: false, reason: "Notifications indisponibles pour le moment." };
  }
}
