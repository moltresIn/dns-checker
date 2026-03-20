import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { getSocketRemoteAddress, isAllowedSocketOrigin } from "@/lib/security";
import type { SocketEnvelope } from "@/lib/types";

type SocketClientSession = {
  socket: WebSocket;
  clientToken: string;
  remoteAddress: string;
  connectedAt: number;
};

const MAX_SOCKET_CLIENTS = 200;

declare global {
  var __dnsSocketServer__: WebSocketServer | undefined;
  var __dnsSocketClients__: Map<string, SocketClientSession> | undefined;
}

const socketClients =
  globalThis.__dnsSocketClients__ ?? new Map<string, SocketClientSession>();

if (!globalThis.__dnsSocketClients__) {
  globalThis.__dnsSocketClients__ = socketClients;
}

function sendEnvelope(socket: WebSocket, envelope: SocketEnvelope) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(envelope));
  }
}

function pruneSocketClients() {
  for (const [clientId, session] of socketClients.entries()) {
    if (session.socket.readyState !== WebSocket.OPEN) {
      socketClients.delete(clientId);
    }
  }

  while (socketClients.size > MAX_SOCKET_CLIENTS) {
    const oldestClientId = socketClients.keys().next().value;

    if (!oldestClientId) {
      break;
    }

    const oldestSession = socketClients.get(oldestClientId);
    oldestSession?.socket.close(1013, "Server is busy");
    socketClients.delete(oldestClientId);
  }
}

export function setupSocketServer() {
  if (globalThis.__dnsSocketServer__) {
    return globalThis.__dnsSocketServer__;
  }

  const wss = new WebSocketServer({
    noServer: true,
    clientTracking: false,
    maxPayload: 1024,
    perMessageDeflate: false
  });

  wss.on("connection", (socket: WebSocket, request: IncomingMessage) => {
    pruneSocketClients();

    const clientId = randomUUID();
    const clientToken = randomUUID();
    socketClients.set(clientId, {
      socket,
      clientToken,
      remoteAddress: getSocketRemoteAddress(request),
      connectedAt: Date.now()
    });

    sendEnvelope(socket, {
      event: "socket:ready",
      payload: {
        clientId,
        clientToken
      }
    });

    socket.on("close", () => {
      socketClients.delete(clientId);
    });

    socket.on("error", () => {
      socketClients.delete(clientId);
    });

    socket.on("message", () => {
      socket.close(1008, "Incoming client messages are not supported.");
      socketClients.delete(clientId);
    });
  });

  globalThis.__dnsSocketServer__ = wss;
  return wss;
}

export function handleSocketUpgrade(
  request: IncomingMessage,
  socket: Parameters<WebSocketServer["handleUpgrade"]>[1],
  head: Buffer
) {
  const wss = setupSocketServer();

  if (!request.url?.startsWith("/ws")) {
    return false;
  }

  pruneSocketClients();

  if (!isAllowedSocketOrigin(request, process.env.NODE_ENV !== "production")) {
    socket.destroy();
    return true;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });

  return true;
}

export function hasSocketClient(clientId: string, clientToken: string, remoteAddress?: string) {
  pruneSocketClients();

  const session = socketClients.get(clientId);

  if (!session || session.socket.readyState !== WebSocket.OPEN) {
    return false;
  }

  if (session.clientToken !== clientToken) {
    return false;
  }

  if (remoteAddress && remoteAddress !== "anonymous" && session.remoteAddress !== remoteAddress) {
    return false;
  }

  return true;
}

export function emitToSocketClient(clientId: string, envelope: SocketEnvelope) {
  pruneSocketClients();

  const session = socketClients.get(clientId);

  if (!session) {
    return false;
  }

  sendEnvelope(session.socket, envelope);
  return true;
}
