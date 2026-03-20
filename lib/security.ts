import type { IncomingMessage } from "node:http";
import type { NextRequest } from "next/server";

const LOCALHOST_ORIGINS = new Set([
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "https://127.0.0.1:3000",
  "https://localhost:3000"
]);

export const MAX_JSON_BODY_BYTES = 16 * 1024;

export const SECURITY_HEADERS = {
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin"
} as const;

function sanitizeIdentifier(value: string | null | undefined) {
  if (!value) {
    return "anonymous";
  }

  return value.trim().slice(0, 128) || "anonymous";
}

function getHeaderValue(
  headers: Headers | IncomingMessage["headers"],
  name: string
): string | null {
  if (headers instanceof Headers) {
    return headers.get(name);
  }

  const rawValue = headers[name.toLowerCase()];

  if (Array.isArray(rawValue)) {
    return rawValue[0] ?? null;
  }

  return rawValue ?? null;
}

export function getClientIdentifier(request: NextRequest) {
  const forwardedFor = getHeaderValue(request.headers, "x-forwarded-for");
  const realIp = getHeaderValue(request.headers, "x-real-ip");

  if (forwardedFor) {
    return sanitizeIdentifier(forwardedFor.split(",")[0]);
  }

  return sanitizeIdentifier(realIp);
}

export function getSocketRemoteAddress(request: IncomingMessage) {
  const forwardedFor = getHeaderValue(request.headers, "x-forwarded-for");
  const realIp = getHeaderValue(request.headers, "x-real-ip");

  if (forwardedFor) {
    return sanitizeIdentifier(forwardedFor.split(",")[0]);
  }

  if (realIp) {
    return sanitizeIdentifier(realIp);
  }

  return sanitizeIdentifier(request.socket.remoteAddress);
}

export function buildSecurityHeaders(init?: HeadersInit) {
  const headers = new Headers(init);

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  return headers;
}

function normalizeOrigin(origin: string | null) {
  if (!origin) {
    return null;
  }

  try {
    return new URL(origin).origin;
  } catch {
    return null;
  }
}

function getConfiguredOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => normalizeOrigin(value.trim()))
    .filter((value): value is string => Boolean(value));
}

export function isAllowedSocketOrigin(request: IncomingMessage, dev: boolean) {
  const origin = normalizeOrigin(getHeaderValue(request.headers, "origin"));
  const host = sanitizeIdentifier(getHeaderValue(request.headers, "host"));
  const configuredOrigins = getConfiguredOrigins();

  if (configuredOrigins.length > 0) {
    return origin !== null && configuredOrigins.includes(origin);
  }

  if (!origin) {
    return dev;
  }

  const sameHostOrigins = new Set([`http://${host}`, `https://${host}`]);

  if (sameHostOrigins.has(origin)) {
    return true;
  }

  return dev && LOCALHOST_ORIGINS.has(origin);
}

export async function readJsonBody<T>(request: NextRequest, maxBytes = MAX_JSON_BODY_BYTES) {
  const contentType = request.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false as const,
      status: 415,
      error: "Content-Type must be application/json."
    };
  }

  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      ok: false as const,
      status: 413,
      error: "Request payload is too large."
    };
  }

  let rawBody = "";

  try {
    rawBody = await request.text();
  } catch {
    return {
      ok: false as const,
      status: 400,
      error: "Unable to read request body."
    };
  }

  if (!rawBody.trim()) {
    return {
      ok: false as const,
      status: 400,
      error: "Request body is required."
    };
  }

  if (Buffer.byteLength(rawBody, "utf8") > maxBytes) {
    return {
      ok: false as const,
      status: 413,
      error: "Request payload is too large."
    };
  }

  try {
    return {
      ok: true as const,
      data: JSON.parse(rawBody) as T
    };
  } catch {
    return {
      ok: false as const,
      status: 400,
      error: "Request body contains invalid JSON."
    };
  }
}
