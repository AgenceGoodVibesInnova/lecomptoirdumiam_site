import type { SupabaseClient } from "@supabase/supabase-js";

// Notifications de l'application via le service gratuit d'Expo (https://docs.expo.dev/push-notifications/sending-notifications/).
const API = "https://exp.host/--/api/v2/push/send";

/** Envoie une notification à tous les téléphones du client. Renvoie le nombre de téléphones atteints. */
export async function pushToUser(admin: SupabaseClient, userId: string, msg: { title: string; body: string; data?: Record<string, unknown> }) {
  const { data: rows } = await admin.from("push_tokens").select("token").eq("user_id", userId);
  const tokens = (rows ?? []).map((r) => r.token as string);
  if (!tokens.length) return 0;
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(tokens.map((to) => ({ to, sound: "default", title: msg.title, body: msg.body, data: msg.data ?? {} }))),
    });
    const json = (await res.json().catch(() => ({}))) as { data?: { status: string; details?: { error?: string } }[] };
    let ok = 0;
    const dead: string[] = [];
    (json.data ?? []).forEach((t, i) => {
      if (t.status === "ok") ok++;
      else if (t.details?.error === "DeviceNotRegistered") dead.push(tokens[i]);
    });
    if (dead.length) await admin.from("push_tokens").delete().in("token", dead);
    return ok;
  } catch (e) {
    console.error("Échec notification", e);
    return 0;
  }
}
