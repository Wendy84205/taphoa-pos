import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const port = Number(process.env.EXPO_PORT ?? 8081);
const root = resolve(process.cwd(), ".web-preview");
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

createServer((request, response) => {
  const pathname = decodeURIComponent((request.url ?? "/").split("?")[0]);
  const requested = resolve(root, `.${normalize(pathname)}`);
  const safe = requested.startsWith(root) ? requested : join(root, "index.html");
  const file = existsSync(safe) && statSync(safe).isFile() ? safe : join(root, "index.html");
  if (!existsSync(file)) {
    response.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Web preview is being prepared.");
    return;
  }
  response.writeHead(200, { "Content-Type": mimeTypes[extname(file)] ?? "application/octet-stream", "Cache-Control": "no-store" });
  createReadStream(file).pipe(response);
}).listen(port, "0.0.0.0", () => {
  console.log(`Web preview listening on http://localhost:${port}`);
});
