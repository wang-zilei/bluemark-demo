import "dotenv/config";
import express from "express";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createApiRouter } from "./proxy";
import type { ProxyOptions } from "./proxy";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function createApp(options: ProxyOptions = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", false);
  app.use("/api", createApiRouter(options));
  if ((options.env || process.env).NODE_ENV === "production") {
    const dist = resolve(projectRoot, "dist");
    app.use(express.static(dist, { dotfiles: "deny", index: "index.html" }));
    app.get("/{*path}", (req, res) => {
      if (!req.accepts("html")) {
        res.status(404).end();
        return;
      }
      res.sendFile(resolve(dist, "index.html"), (error) => {
        if (error && !res.headersSent)
          res
            .status(503)
            .type("text")
            .send(
              "Frontend build missing. Run npm run build before npm start.",
            );
      });
    });
  }
  return app;
}

export function startServer() {
  const port = Number(process.env.PORT || 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be an integer between 1 and 65535.");
  const server = createApp().listen(port, "127.0.0.1", () => {
    console.info(`BlueMark local proxy: http://127.0.0.1:${port}`);
  });
  server.requestTimeout = 200000;
  server.headersTimeout = 15000;
  return server;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  startServer();
