import { createServer } from "node:http";
import { parse } from "node:url";
import next from "next";
import { handleSocketUpgrade, setupSocketServer } from "./lib/socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST ?? (dev ? "127.0.0.1" : "0.0.0.0");
const port = Number.parseInt(process.env.PORT ?? "3000", 10);

async function bootstrap() {
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error("PORT must be a valid TCP port between 1 and 65535.");
  }

  let handleRequest:
    | ReturnType<ReturnType<typeof next>["getRequestHandler"]>
    | null = null;

  const server = createServer((request, response) => {
    if (!handleRequest) {
      response.statusCode = 503;
      response.end("Server is starting. Please retry in a moment.");
      return;
    }

    const parsedUrl = parse(request.url ?? "/", true);
    void handleRequest(request, response, parsedUrl);
  });
  server.requestTimeout = 15_000;
  server.headersTimeout = 16_000;
  server.keepAliveTimeout = 5_000;

  const app = next({
    dev,
    hostname,
    port,
    dir: process.cwd(),
    httpServer: server,
    turbopack: false,
    webpack: true
  });

  await app.prepare();
  handleRequest = app.getRequestHandler();

  const handleUpgrade = app.getUpgradeHandler();
  setupSocketServer();

  server.on("upgrade", async (request, socket, head) => {
    try {
      if (handleSocketUpgrade(request, socket, head)) {
        return;
      }

      await handleUpgrade(request, socket, head);
    } catch {
      socket.destroy();
    }
  });

  server.listen(port, hostname, () => {
    process.stdout.write(
      `> DNS Lens ready on http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}\n`
    );
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

void bootstrap().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown server startup failure.";
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
