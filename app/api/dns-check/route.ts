import { NextRequest, NextResponse } from "next/server";
import {
  MAX_BULK_DOMAINS,
  checkRateLimit,
  getCachedResults,
  isValidRecordType,
  normalizeDomain,
  parseBulkDomains,
  runDnsChecks,
  startValidatedBulkJob
} from "@/lib/dns";
import { buildSecurityHeaders, getClientIdentifier, readJsonBody } from "@/lib/security";
import { hasSocketClient } from "@/lib/socket";
import type { DnsBulkRequest, DnsSyncResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = normalizeDomain(searchParams.get("domain") || "");
  const recordType = searchParams.get("recordType") || "";

  if (!domain) {
    return NextResponse.json(
      { error: "Please enter a valid domain name." },
      { status: 400, headers: buildSecurityHeaders() }
    );
  }

  if (!isValidRecordType(recordType)) {
    return NextResponse.json(
      { error: "Unsupported DNS record type." },
      { status: 400, headers: buildSecurityHeaders() }
    );
  }

  const rateLimit = checkRateLimit(getClientIdentifier(request));

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please wait a moment before trying again."
      },
      {
        status: 429,
        headers: buildSecurityHeaders({
          "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString()
        })
      }
    );
  }

  const cached = getCachedResults(domain, recordType);
  const run = await runDnsChecks(domain, recordType);

  const payload: DnsSyncResponse = {
    domain,
    recordType,
    cached: Boolean(cached) || run.cached,
    checkedAt: new Date().toISOString(),
    results: run.results
  };

  return NextResponse.json(payload, {
    headers: buildSecurityHeaders({
      "Cache-Control": "private, max-age=0, must-revalidate"
    })
  });
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(getClientIdentifier(request));

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded. Please wait a moment before trying again."
      },
      {
        status: 429,
        headers: buildSecurityHeaders({
          "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString()
        })
      }
    );
  }

  const parsedBody = await readJsonBody<Partial<DnsBulkRequest>>(request);

  if (!parsedBody.ok) {
    return NextResponse.json(
      {
        error: parsedBody.error
      },
      { status: parsedBody.status, headers: buildSecurityHeaders() }
    );
  }

  const body = parsedBody.data;
  const recordType = body.recordType ?? "";
  const rawDomains = Array.isArray(body.domains) ? body.domains.map(String) : [];
  const clientId = typeof body.clientId === "string" ? body.clientId.trim() : "";
  const clientToken = typeof body.clientToken === "string" ? body.clientToken.trim() : "";

  if (!isValidRecordType(recordType)) {
    return NextResponse.json(
      { error: "Unsupported DNS record type." },
      { status: 400, headers: buildSecurityHeaders() }
    );
  }

  if (!clientId || !clientToken || !hasSocketClient(clientId, clientToken, getClientIdentifier(request))) {
    return NextResponse.json(
      {
        error: "Live socket connection is not ready yet. Please reconnect and try again."
      },
      { status: 400, headers: buildSecurityHeaders() }
    );
  }

  const { domains, invalidDomains } = parseBulkDomains(rawDomains);

  if (domains.length === 0) {
    return NextResponse.json(
      {
        error: "Please provide at least one valid domain name.",
        invalidDomains
      },
      { status: 400, headers: buildSecurityHeaders() }
    );
  }

  if (domains.length > MAX_BULK_DOMAINS) {
    return NextResponse.json(
      {
        error: `You can check up to ${MAX_BULK_DOMAINS} domains at a time.`,
        invalidDomains
      },
      { status: 400, headers: buildSecurityHeaders() }
    );
  }

  try {
    const response = startValidatedBulkJob({
      domains,
      clientId,
      clientToken,
      recordType,
      retryCount: body.retryCount
    });

    return NextResponse.json(
      {
        ...response,
        invalidDomains
      },
      { headers: buildSecurityHeaders({ "Cache-Control": "no-store" }) }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to start DNS job."
      },
      { status: 503, headers: buildSecurityHeaders({ "Retry-After": "5" }) }
    );
  }
}
