import type { SupabaseClient } from "@supabase/supabase-js";

export type Loyalty = { enabled: boolean; goal: number; stamps: number; available: number; rewardCents: number; rewardLabel: string };

/** Carte de fidélité : 1 tampon par commande payée ; une récompense tous les `goal` tampons. */
export async function loyaltyFor(admin: SupabaseClient, userId: string): Promise<Loyalty> {
  const { data: s } = await admin.from("settings").select("loyalty_enabled, loyalty_goal, loyalty_reward_cents, loyalty_reward_label").eq("id", 1).single();
  const goal = s?.loyalty_goal ?? 10;
  const [{ count: paid }, { count: used }] = await Promise.all([
    admin.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId).not("paid_at", "is", null).neq("status", "annulee"),
    admin.from("orders").select("id", { count: "exact", head: true }).eq("user_id", userId).not("paid_at", "is", null).eq("reward_used", true),
  ]);
  const p = paid ?? 0;
  return {
    enabled: s?.loyalty_enabled ?? true,
    goal,
    stamps: p % goal,
    available: Math.max(0, Math.floor(p / goal) - (used ?? 0)),
    rewardCents: s?.loyalty_reward_cents ?? 500,
    rewardLabel: s?.loyalty_reward_label ?? "5 € offerts sur votre commande",
  };
}
