import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.lecomptoirdumiam.fr";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/carte", "/commander"].map((p) => ({ url: `${SITE}${p}`, changeFrequency: "weekly", priority: p ? 0.8 : 1 }));
}
