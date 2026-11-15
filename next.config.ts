import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Aperçu web de l'application mobile (public/app, construit par « npm run apercu » dans mobile/).
  async rewrites() {
    return [
      { source: "/app", destination: "/app/index.html" },
      { source: "/app/:path((?!_expo|assets|favicon).*)", destination: "/app/index.html" },
    ];
  },
};

export default nextConfig;
