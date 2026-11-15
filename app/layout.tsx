import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Le Comptoir du Miam", template: "%s · Le Comptoir du Miam" },
  description: "Brunch, snack, restaurant et épicerie au cœur du camping La Dune des Sables. Commandez en ligne.",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Antonio:wght@400;600;700&family=Barlow:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
