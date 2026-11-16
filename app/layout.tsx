import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Le Comptoir du Miam", template: "%s · Le Comptoir du Miam" },
  description: "Brunch, snack, restaurant et épicerie au cœur du camping La Dune des Sables. Commandez en ligne.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lecomptoirdumiam.fr"),
  openGraph: {
    title: "Le Comptoir du Miam",
    description: "Brunch, snack, restaurant et épicerie au cœur du camping La Dune des Sables. Commandez en ligne.",
    images: [{ url: "/logo.png", width: 400, height: 330, alt: "Le Comptoir du Miam" }],
    locale: "fr_FR",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#efe8db" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preload" href="/fonts/Antonio_700Bold.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="preload" href="/fonts/Barlow_400Regular.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  );
}
