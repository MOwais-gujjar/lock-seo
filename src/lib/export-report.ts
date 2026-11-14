import type { BacklinkAnalysisResult, SEOAuditResult } from "@/types/seo";

/**
 * Escapes a cell value for valid CSV output according to RFC 4180.
 */
function escapeCsvCell(value: unknown): string {
  if (value === null || typeof value === "undefined") {
    return '""';
  }
  const stringValue = String(value);
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return `"${stringValue}"`;
}

/**
 * Sanitizes a domain name for safe cross-platform file naming.
 */
function getFileSafeDomain(targetUrl: string, fallbackDomain = "domain"): string {
  try {
    const url = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
    return url.hostname.replace(/^www\./, "").replace(/[^a-zA-Z0-9.-]/g, "-");
  } catch {
    return fallbackDomain.replace(/[^a-zA-Z0-9.-]/g, "-");
  }
}

/**
 * Initiates a browser client-side download using an ephemeral Blob URL.
 */
function triggerBrowserDownload(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(downloadUrl);
}

/**
 * Exports complete SEO audit and backlink intelligence as formatted JSON.
 */
export function exportAsJSON(
  seoData: SEOAuditResult,
  backlinkData: BacklinkAnalysisResult | null
): void {
  const safeDomain = getFileSafeDomain(seoData.targetUrl, backlinkData?.domain);
  const dateStamp = new Date().toISOString().split("T")[0];
  const filename = `${safeDomain}-seo-report-${dateStamp}.json`;

  const payload = {
    exportedAt: new Date().toISOString(),
    generator: "Lock SEO Toolkit v0.1.0",
    audit: seoData,
    backlinks: backlinkData,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  triggerBrowserDownload(filename, jsonString, "application/json;charset=utf-8;");
}

/**
 * Generates and downloads a multi-section technical CSV report covering executive overview,
 * actionable issues, passed validations, n-gram keyword densities, and referring backlinks.
 */
export function exportAsCSV(
  seoData: SEOAuditResult,
  backlinkData: BacklinkAnalysisResult | null
): void {
  const safeDomain = getFileSafeDomain(seoData.targetUrl, backlinkData?.domain);
  const dateStamp = new Date().toISOString().split("T")[0];
  const filename = `${safeDomain}-seo-audit-${dateStamp}.csv`;

  const lines: string[] = [];

  // 1. Executive Summary Section
  lines.push("# SECTION 1: EXECUTIVE AUDIT & PERFORMANCE SUMMARY");
  lines.push(
    [
      "Target URL",
      "Final URL",
      "SEO Health Score",
      "HTTP Status",
      "TTFB (ms)",
      "HTML Size (KB)",
      "PageRank Decimal",
      "Global Rank",
      "Word Count",
      "Internal Links",
      "External Links",
      "Backlinks Discovered",
      "Scanned At",
    ].map(escapeCsvCell).join(",")
  );

  lines.push(
    [
      seoData.targetUrl,
      seoData.finalUrl,
      seoData.seoScore,
      seoData.httpStatus,
      seoData.responseTimeMs,
      (seoData.htmlSizeBytes / 1024).toFixed(2),
      backlinkData?.authority?.pageRankDecimal ?? "N/A",
      backlinkData?.authority?.globalRank ?? "Unranked",
      seoData.keywords.totalWordCount,
      seoData.links.internalCount,
      seoData.links.externalCount,
      backlinkData?.totalFound ?? 0,
      seoData.fetchedAt,
    ].map(escapeCsvCell).join(",")
  );
  lines.push("");

  // 2. Actionable Issues & Fix Recommendations Section
  lines.push("# SECTION 2: ACTIONABLE SEO ISSUES & RECOMMENDATIONS");
  lines.push(
    ["Severity", "Category", "Issue Message", "Recommended Fix", "Current Detected Value"].map(escapeCsvCell).join(",")
  );

  if (seoData.actionableIssues.length === 0) {
    lines.push(["None", "None", "No critical or warning SEO issues found.", "All checks passed.", ""].map(escapeCsvCell).join(","));
  } else {
    for (const issue of seoData.actionableIssues) {
      lines.push(
        [
          issue.severity.toUpperCase(),
          issue.category,
          issue.message,
          issue.recommendation,
          issue.currentValue ?? "",
        ].map(escapeCsvCell).join(",")
      );
    }
  }
  lines.push("");

  // 3. Passed Technical Validations Section
  lines.push("# SECTION 3: PASSED TECHNICAL SEO VALIDATIONS");
  lines.push(["Category", "Validation Check", "Verified Value"].map(escapeCsvCell).join(","));

  for (const check of seoData.passedChecks) {
    lines.push([check.category, check.message, check.value ?? ""].map(escapeCsvCell).join(","));
  }
  lines.push("");

  // 4. Keyword Frequency & Density Section (1-gram, 2-gram, 3-gram)
  lines.push("# SECTION 4: KEYWORD DENSITY & N-GRAM ANALYSIS");
  lines.push(
    ["N-Gram Type", "Rank", "Term / Phrase", "Frequency Count", "Density %", "In Title", "In H1", "In Meta Description"].map(escapeCsvCell).join(",")
  );

  const appendKeywords = (type: string, list: typeof seoData.keywords.oneGrams) => {
    list.forEach((item, index) => {
      lines.push(
        [
          type,
          index + 1,
          item.term,
          item.count,
          `${item.density}%`,
          item.inTitle ? "YES" : "NO",
          item.inH1 ? "YES" : "NO",
          item.inMetaDescription ? "YES" : "NO",
        ].map(escapeCsvCell).join(",")
      );
    });
  };

  appendKeywords("1-Word (Single)", seoData.keywords.oneGrams);
  appendKeywords("2-Word (Bigram)", seoData.keywords.twoGrams);
  appendKeywords("3-Word (Trigram)", seoData.keywords.threeGrams);
  lines.push("");

  // 5. Discovered Referring Backlinks Section
  lines.push("# SECTION 5: DISCOVERED REFERRING BACKLINKS & MENTIONS");
  lines.push(
    ["Source Domain", "Source URL", "Page Title", "Snippet Context", "Platform Category", "Link Type"].map(escapeCsvCell).join(",")
  );

  if (!backlinkData || backlinkData.backlinks.length === 0) {
    lines.push(["None", "None", "No external referring citations found via search operator.", "", "", ""].map(escapeCsvCell).join(","));
  } else {
    for (const link of backlinkData.backlinks) {
      lines.push(
        [
          link.sourceDomain,
          link.sourceUrl,
          link.title,
          link.snippet,
          link.platformCategory,
          link.linkType,
        ].map(escapeCsvCell).join(",")
      );
    }
  }

  const csvContent = lines.join("\r\n");
  triggerBrowserDownload(filename, csvContent, "text/csv;charset=utf-8;");
}
