import type { Mode, OrderStatus } from "./types";

export const euros = (cents: number) =>
  (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

export const dateHeure = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

export const MODES: Record<Mode, { label: string; lieu: string; aide: string }> = {
  mobilhome: { label: "Au mobil-home", lieu: "N° de mobil-home", aide: "ex. 42" },
  emporter: { label: "À emporter", lieu: "Heure de retrait", aide: "ex. 12:30" },
  table: { label: "À table", lieu: "N° de table", aide: "ex. 7" },
};

export const STATUTS: Record<OrderStatus, string> = {
  en_attente_paiement: "En attente de paiement",
  nouvelle: "Nouvelle",
  en_preparation: "En préparation",
  prete: "Prête",
  terminee: "Terminée",
  annulee: "Annulée",
};

export const isMode = (m: string): m is Mode => m === "mobilhome" || m === "emporter" || m === "table";
