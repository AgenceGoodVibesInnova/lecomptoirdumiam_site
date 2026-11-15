import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as { siteUrl: string; supabaseUrl: string; supabaseKey: string };

/** Adresse du site (API, paiement). Valeurs publiques : aucune clé secrète dans l'application. */
export const SITE = extra.siteUrl;
export const SUPABASE_URL = extra.supabaseUrl;
export const SUPABASE_KEY = extra.supabaseKey;
