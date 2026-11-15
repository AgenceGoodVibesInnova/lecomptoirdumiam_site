"use client";
import { useActionState } from "react";
import { saveSettings, type Result } from "@/app/admin/actions";
import { Field, Flash, PageHead } from "./ui";
import type { Settings } from "@/lib/types";

export default function SettingsForm({ s, canEdit }: { s: Settings; canEdit: boolean }) {
  const [state, action, pending] = useActionState<Result | null, FormData>(saveSettings, null);
  const v = (k: keyof Settings) => (s[k] as string | null | undefined) ?? "";
  return (
    <>
      <PageHead kicker="Restaurant" title="Réglages" />
      <form action={action} className="a-grid2" style={{ alignItems: "start" }}>
        <fieldset disabled={!canEdit} className="a-card a-card-pad a-form" style={{ margin: 0 }}>
          <h3 style={{ marginTop: 0 }}>Commande en ligne</h3>
          <label className="a-check"><input type="checkbox" name="ordering_open" defaultChecked={s.ordering_open} /> <span><strong>Commande en ligne ouverte</strong> · décochez pour la suspendre (fermeture, coup de feu…)</span></label>
          <h3>Infos affichées sur le site</h3>
          <Field label="Bandeau d'ouverture" htmlFor="opening_label" span><input id="opening_label" name="opening_label" defaultValue={v("opening_label")} /></Field>
          <Field label="Nom du camping" htmlFor="camping_name"><input id="camping_name" name="camping_name" defaultValue={v("camping_name")} /></Field>
          <Field label="Téléphone" htmlFor="phone"><input id="phone" name="phone" defaultValue={v("phone")} /></Field>
          <Field label="Adresse" htmlFor="address" span><textarea id="address" name="address" defaultValue={v("address")} /></Field>
          <Field label="Horaires" htmlFor="hours" span><textarea id="hours" name="hours" defaultValue={v("hours")} placeholder="ex. Tous les jours, 8h–22h" /></Field>
          <Field label="E-mail de contact" htmlFor="contact_email"><input id="contact_email" name="contact_email" defaultValue={v("contact_email")} /></Field>
          <Field label="Lien Instagram" htmlFor="instagram_url"><input id="instagram_url" name="instagram_url" defaultValue={v("instagram_url")} placeholder="https://www.instagram.com/…" /></Field>
          <Field label="Lien de la page Uber Eats" htmlFor="ubereats_url" span><input id="ubereats_url" name="ubereats_url" defaultValue={v("ubereats_url")} placeholder="https://www.ubereats.com/…" /></Field>
          <p className="a-hint span" style={{ margin: 0 }}>Les champs laissés vides n'apparaissent pas sur le site.</p>
        </fieldset>
        <fieldset disabled={!canEdit} className="a-card a-card-pad a-form" style={{ margin: 0 }}>
          <h3 style={{ marginTop: 0 }}>Mentions légales des factures</h3>
          <Field label="Raison sociale" htmlFor="legal_name" span><input id="legal_name" name="legal_name" defaultValue={v("legal_name")} placeholder="ex. SAS Le Comptoir du Miam" /></Field>
          <Field label="Adresse du siège" htmlFor="legal_address" span><textarea id="legal_address" name="legal_address" defaultValue={v("legal_address")} /></Field>
          <Field label="SIRET" htmlFor="siret"><input id="siret" name="siret" defaultValue={v("siret")} /></Field>
          <Field label="N° de TVA intracommunautaire" htmlFor="vat_number"><input id="vat_number" name="vat_number" defaultValue={v("vat_number")} /></Field>
          <Field label="Pied de facture" htmlFor="invoice_footer" span hint="ex. capital social, RCS, conditions de paiement."><textarea id="invoice_footer" name="invoice_footer" defaultValue={v("invoice_footer")} /></Field>
          <Flash result={state} />
          {canEdit ? <div className="a-form-actions" style={{ justifyContent: "flex-end" }}><button className="a-btn primary" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer les réglages"}</button></div> : null}
        </fieldset>
      </form>
    </>
  );
}
