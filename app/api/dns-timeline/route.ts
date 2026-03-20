import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, isValidRecordType, normalizeDomain } from "@/lib/dns";
import { buildSecurityHeaders, getClientIdentifier } from "@/lib/security";
import { clearTimeline, getTimeline } from "@/lib/timelineStore";

export const runtime = "nodejs";

function parseRequest(request: NextRequest) {
  const domain = normalizeDomain(request.nextUrl.searchParams.get("domain") || "");
  const recordType = request.nextUrl.searchParams.get("recordType") || "";

  if (!domain || !isValidRecordType(recordType)) {
    return null;
  }

  return {
    domain,
    recordType
  };
}

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit(getClientIdentifier(request));

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment before trying again." },
      {
        status: 429,
        headers: buildSecurityHeaders({
          "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString()
        })
      }
    );
  }

  const params = parseRequest(request);

  if (!params) {
    return NextResponse.json(
      { error: "Invalid timeline request." },
      { status: 400, headers: buildSecurityHeaders() }
    );
  }

  return NextResponse.json(
    getTimeline(params.domain, params.recordType) ?? {
      domain: params.domain,
      recordType: params.recordType,
      history: [],
      snapshots: [],
      firstSuccessAt: null,
      fullPropagationAt: null,
      latestUpdateAt: null
    },
    {
      headers: buildSecurityHeaders({
        "Cache-Control": "private, max-age=0, must-revalidate"
      })
    }
  );
}

export async function DELETE(request: NextRequest) {
  const rateLimit = checkRateLimit(getClientIdentifier(request));

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please wait a moment before trying again." },
      {
        status: 429,
        headers: buildSecurityHeaders({
          "Retry-After": Math.ceil(rateLimit.retryAfterMs / 1000).toString()
        })
      }
    );
  }

  const params = parseRequest(request);

  if (!params) {
    return NextResponse.json(
      { error: "Invalid timeline request." },
      { status: 400, headers: buildSecurityHeaders() }
    );
  }

  clearTimeline(params.domain, params.recordType);

  return NextResponse.json(
    {
      ok: true
    },
    { headers: buildSecurityHeaders({ "Cache-Control": "no-store" }) }
  );
}
