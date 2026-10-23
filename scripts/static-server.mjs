import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, sep, extname } from "node:path";
const root = resolve("dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
};
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://127.0.0.1");
    const prefix = "/backfort-docs/";
    if (!url.pathname.startsWith(prefix)) {
      res.writeHead(404).end("Not found");
      return;
    }
    const path = resolve(
      root,
      decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html",
    );
    if (!path.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    const body = await readFile(path);
    res.writeHead(200, {
      "Content-Type": mime[extname(path)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(404).end("Not found");
  }
});
server.listen(Number(process.env.TEST_PORT || 4180), "127.0.0.1", () =>
  console.log("Static prefix server ready."),
);
