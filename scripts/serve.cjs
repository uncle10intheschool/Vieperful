// Máy chủ tĩnh nhỏ, không cần cài thư viện. Chỉ phục vụ các tài nguyên công khai.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".webp": "image/webp", ".mp4": "video/mp4", ".woff2": "font/woff2" };
const server = http.createServer((request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) { response.writeHead(405).end(); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname); }
  catch { response.writeHead(400).end("Bad request"); return; }
  if (pathname === "/") pathname = "/index.html";
  if (pathname !== "/index.html" && !/^\/(assets|css|js)\//.test(pathname)) { response.writeHead(404).end("Not found"); return; }
  const file = path.resolve(root, "." + pathname);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end("Forbidden"); return; }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) { response.writeHead(404).end("Not found"); return; }
    const headers = { "Content-Type": types[path.extname(file)] || "application/octet-stream", "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-cache" };
    let start = 0, end = stat.size - 1, status = 200;
    if (request.headers.range) {
      const range = /^bytes=(\d+)-(\d*)$/.exec(request.headers.range);
      if (!range) { response.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end(); return; }
      start = Number(range[1]);
      end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : end;
      if (start > end || start >= stat.size) { response.writeHead(416, { "Content-Range": `bytes */${stat.size}` }).end(); return; }
      status = 206;
      headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
    }
    headers["Content-Length"] = end - start + 1;
    response.writeHead(status, headers);
    if (request.method === "HEAD") { response.end(); return; }
    const stream = fs.createReadStream(file, { start, end });
    stream.on("error", () => response.destroy());
    stream.pipe(response);
  });
});
server.listen(port, host, () => console.log(`Vieperful: http://${host}:${port}`));
