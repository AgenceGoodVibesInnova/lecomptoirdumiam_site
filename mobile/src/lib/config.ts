import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as { siteUrl: string; supabaseUrl: string; supabaseKey: string };

/** Adresse du site (API, paiement). Valeurs publiques : aucune clé secrète dans l'application. */
// Les variables EXPO_PUBLIC_* permettent de pointer une version de test vers une autre adresse.
export const SITE = process.env.EXPO_PUBLIC_SITE_URL || extra.siteUrl;
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl;
export const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_KEY || extra.supabaseKey;
