import { NextRequest, NextResponse } from "next/server";
import { analyzeOnPageSEO, SEOFetchError } from "@/lib/seo-analyzer";
import type { SEOAuditResult } from "@/types/seo";

export const dynamic = "force-dynamic";

/**
 * Normalizes and validates an incoming URL string.
 * Automatically prepends `https://` if no protocol is provided.
 */
function normalizeTargetUrl(rawInput: string): string {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    throw new Error("URL cannot be empty.");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error(`Invalid URL syntax: "${rawInput}".`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS protocols are supported.");
  }

  if (!parsed.hostname || !parsed.hostname.includes(".")) {
    throw new Error(
      `Invalid hostname "${parsed.hostname}". Please provide a valid domain (e.g., example.com).`
    );
  }

  return parsed.toString();
}

export async function POST(
  request: NextRequest
): Promise<
  NextResponse<
    | SEOAuditResult
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

  const rawUrl =
    body && typeof body === "object" && "url" in body
      ? (body as { url?: unknown }).url
      : undefined;

  if (typeof rawUrl !== "string" || !rawUrl.trim()) {
    return NextResponse.json(
      {
        error: "Missing or invalid 'url' string in request body.",
        code: "MISSING_URL",
      },
      { status: 400 }
    );
  }

  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeTargetUrl(rawUrl);
  } catch (validationError) {
    return NextResponse.json(
      {
        error:
          validationError instanceof Error
            ? validationError.message
            : "Invalid URL provided.",
        code: "INVALID_URL",
      },
      { status: 400 }
    );
  }

  try {
    const auditResult: SEOAuditResult = await analyzeOnPageSEO(normalizedUrl);
    return NextResponse.json(auditResult, { status: 200 });
  } catch (err) {
    if (err instanceof SEOFetchError) {
      return NextResponse.json(
        {
          error: err.message,
          code: err.code,
        },
        { status: err.statusCode }
      );
    }

    return NextResponse.json(
      {
        error: "An unexpected server error occurred during SEO analysis.",
        code: "INTERNAL_SERVER_ERROR",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
