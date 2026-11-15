"use client";
import { useEffect, useRef, useState } from "react";
import type { Result } from "@/app/admin/actions";

export const Icon = {
  pencil: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>,
  trash: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>,
  plus: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>,
  close: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>,
  back: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>,
  next: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>,
  doc: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 3H6v18h12V7z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></svg>,
  mail: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
};

export function PageHead({ kicker, title, children }: { kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="a-head">
      <div><p className="a-kick">{kicker}</p><h1 className="a-title">{title}</h1></div>
      {children ? <div className="a-head-actions">{children}</div> : null}
    </div>
  );
}

export function Drawer({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    ref.current?.querySelector<HTMLElement>("input,select,textarea")?.focus();
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="a-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="a-drawer" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="a-drawer-head">
          <h2>{title}</h2>
          <button type="button" className="a-icon" onClick={onClose} aria-label="Fermer">{Icon.close}</button>
        </div>
        <div className="a-drawer-body">{children}</div>
      </div>
    </div>
  );
}

export function Flash({ result }: { result: Result | null }) {
  if (!result) return null;
  return result.ok
    ? result.message ? <p className="a-flash ok" role="status">{result.message}</p> : null
    : <p className="a-flash err" role="alert">{result.error}</p>;
}

/** Petit message flottant après une action rapide (statut, suppression…). */
export function useToast() {
  const [toast, setToast] = useState<Result | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.ok ? 2500 : 6000);
    return () => clearTimeout(t);
  }, [toast]);
  const node = toast && (toast.ok ? toast.message : true) ? (
    <div className={`a-toast ${toast.ok ? "ok" : "err"}`} role="status">{toast.ok ? toast.message : toast.error}</div>
  ) : null;
  return { show: setToast, node };
}

export function Field({ label, htmlFor, hint, children, span }: { label: string; htmlFor: string; hint?: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div className={`a-field${span ? " span" : ""}`}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {hint ? <span className="a-hint">{hint}</span> : null}
    </div>
  );
}

export const centsToInput = (c: number | null | undefined) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));
