import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lecomptoirdumiam.fr";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/compte", "/commande/", "/paiement/", "/payer/", "/facture/", "/api", "/auth", "/app", "/mot-de-passe"] },
    sitemap: `${SITE}/sitemap.xml`,
  };
}
