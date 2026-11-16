// Passerelle locale « façon Supabase » : /rest/v1 → PostgREST, /auth/v1 → GoTrue, CORS ouvert (tests locaux).
const http = require("http");
const routes = [["/rest/v1", 3001], ["/auth/v1", 9999]];
http.createServer((req, res) => {
  const cors = {
    "access-control-allow-origin": req.headers.origin || "*",
    "access-control-allow-credentials": "true",
    "access-control-allow-headers": req.headers["access-control-request-headers"] || "*",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-expose-headers": "content-range, x-total-count",
  };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const r = routes.find(([p]) => req.url.startsWith(p));
  if (!r) { res.writeHead(404, cors); return res.end("{}"); }
  const p = http.request({ host: "127.0.0.1", port: r[1], path: req.url.slice(r[0].length) || "/", method: req.method, headers: { ...req.headers, host: `127.0.0.1:${r[1]}` } }, (up) => {
    const h = { ...up.headers, ...cors };
    res.writeHead(up.statusCode, h);
    up.pipe(res);
  });
  p.on("error", (e) => { res.writeHead(502, cors); res.end(JSON.stringify({ error: String(e) })); });
  req.pipe(p);
}).listen(54321, "127.0.0.1", () => console.log("gateway 54321"));
