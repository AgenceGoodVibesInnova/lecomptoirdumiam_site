export type Mode = "mobilhome" | "emporter" | "table";
export type Status = "en_attente_paiement" | "nouvelle" | "en_preparation" | "prete" | "terminee" | "annulee";

export const euros = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} €`;

export const heure = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
};
export const dateCourte = (iso: string) => {
  const d = new Date(iso);
  const mois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  return `${d.getDate()} ${mois[d.getMonth()]} · ${heure(iso)}`;
};

export const MODES: Record<Mode, { label: string; lieu: string; aide: string; detail: string }> = {
  mobilhome: { label: "Au mobil-home", lieu: "N° de mobil-home", aide: "ex. 42", detail: "On vous l'apporte" },
  emporter: { label: "À emporter", lieu: "Heure de retrait", aide: "ex. 12:30", detail: "À récupérer au comptoir" },
  table: { label: "À table", lieu: "N° de table", aide: "ex. 7", detail: "Servi à votre table" },
};

export const STATUTS: Record<Status, string> = {
  en_attente_paiement: "En attente de paiement",
  nouvelle: "Reçue",
  en_preparation: "En préparation",
  prete: "Prête",
  terminee: "Terminée",
  annulee: "Annulée",
};
