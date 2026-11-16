import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// API ouverte à l'application (aperçu web inclus) : authentification par jeton « Bearer », jamais par cookie
// en cross-origin (« * » sans credentials : le navigateur n'envoie pas les cookies du site).
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Max-Age": "86400",
};

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (request.method === "OPTIONS") return new NextResponse(null, { status: 204, headers: CORS });
    if (request.headers.get("authorization")?.startsWith("Bearer ")) {
      const r = NextResponse.next({ request });
      Object.entries(CORS).forEach(([k, v]) => r.headers.set(k, v));
      return r;
    }
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user && path.startsWith("/compte")) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    url.searchParams.set("suite", path);
    return NextResponse.redirect(url);
  }
  if (!user && path.startsWith("/admin") && !path.startsWith("/admin/connexion") && !path.startsWith("/admin/mot-de-passe")) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/connexion";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Pas de middleware (ni d'appel à Supabase) pour les fichiers statiques : polices, images, aperçu de l'application.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|fonts/|app/|robots.txt|sitemap.xml|api/sumup|.*\\.(?:png|svg|jpg|jpeg|webp|ico|woff2|ttf|js|css|map)$).*)"],
};
