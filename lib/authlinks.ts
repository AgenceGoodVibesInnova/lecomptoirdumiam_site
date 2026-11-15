import { supabaseService } from "./supabase/server";
import { siteUrl } from "./emails/layout";

type LinkType = "signup" | "recovery" | "invite" | "magiclink";

const safeNext = (n: string | undefined, fallback: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : fallback);

/**
 * Crée un lien de connexion à usage unique qui passe par notre propre page /auth/confirm,
 * pour l'envoyer dans un e-mail aux couleurs du Miam (au lieu de l'e-mail par défaut de Supabase).
 */
export async function makeAuthLink(
  type: LinkType,
  email: string,
  opts: { password?: string; data?: Record<string, unknown>; next?: string } = {},
) {
  const admin = supabaseService();
  const params =
    type === "signup"
      ? { type, email, password: opts.password!, options: { data: opts.data } }
      : type === "invite"
        ? { type, email, options: { data: opts.data } }
        : { type, email };
  const { data, error } = await admin.auth.admin.generateLink(params as Parameters<typeof admin.auth.admin.generateLink>[0]);
  if (error || !data?.properties?.hashed_token) return { error: error?.message ?? "Lien impossible à créer", link: null, userId: null };
  const otpType = type === "magiclink" ? "magiclink" : type === "signup" ? "signup" : type;
  const next = safeNext(opts.next, type === "recovery" || type === "invite" ? "/mot-de-passe" : "/compte");
  const link = `${siteUrl()}/auth/confirm?token_hash=${encodeURIComponent(data.properties.hashed_token)}&type=${otpType}&next=${encodeURIComponent(next)}`;
  return { error: null, link, userId: data.user?.id ?? null };
}
