import { NextRequest, NextResponse } from "next/server";
import { discoverBacklinksAndAuthority, normalizeDomain } from "@/lib/backlink-finder";
import type { BacklinkAnalysisResult } from "@/types/seo";

export async function POST(
  request: NextRequest
): Promise<
  NextResponse<
    | BacklinkAnalysisResult
    | { error: string; code: string; details?: string }
  >
> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON payload in request body.",
        code: "INVALID_JSON",
      },
      { status: 400 }
    );
  }

  const payload = body as { url?: unknown; domain?: unknown };
  const rawTarget =
    typeof payload?.url === "string" && payload.url.trim()
      ? payload.url
      : typeof payload?.domain === "string" && payload.domain.trim()
      ? payload.domain
      : undefined;

  if (!rawTarget) {
    return NextResponse.json(
      {
        error: "Missing required 'url' or 'domain' parameter in request body.",
        code: "MISSING_TARGET",
      },
      { status: 400 }
    );
  }

  try {
    // Validate domain format early
    normalizeDomain(rawTarget);
  } catch (validationErr) {
    return NextResponse.json(
      {
        error:
          validationErr instanceof Error
            ? validationErr.message
            : "Invalid domain or URL format.",
        code: "INVALID_TARGET",
      },
      { status: 400 }
    );
  }

  try {
    const result: BacklinkAnalysisResult = await discoverBacklinksAndAuthority(
      rawTarget
    );
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to discover backlinks and domain authority.",
        code: "INTERNAL_SERVER_ERROR",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
