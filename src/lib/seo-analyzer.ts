import * as cheerio from "cheerio";
import { extractKeywordMetrics } from "@/lib/keyword-extractor";
import type {
  HeadingGroup,
  HeadingStructure,
  ImageAccessibilityReport,
  LinkArchitectureReport,
  LinkItem,
  MetaOverview,
  SEOAuditResult,
  SEOIssue,
  SEOPassedCheck,
} from "@/types/seo";

const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const FETCH_TIMEOUT_MS = 15000;

export class SEOFetchError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 502, code = "FETCH_ERROR") {
    super(message);
    this.name = "SEOFetchError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Extracts `@type` values recursively from a parsed JSON-LD payload.
 */
function extractJsonLdTypes(node: unknown, collector: Set<string>): void {
  if (!node || typeof node !== "object") return;

  if (Array.isArray(node)) {
    for (const item of node) {
      extractJsonLdTypes(item, collector);
    }
    return;
  }

  const record = node as Record<string, unknown>;
  const rawType = record["@type"];

  if (typeof rawType === "string" && rawType.trim()) {
    collector.add(rawType.trim());
  } else if (Array.isArray(rawType)) {
    for (const t of rawType) {
      if (typeof t === "string" && t.trim()) {
        collector.add(t.trim());
      }
    }
  }

  if (Array.isArray(record["@graph"])) {
    extractJsonLdTypes(record["@graph"], collector);
  }
}

/**
 * Normalizes whitespace in text extracted from DOM nodes.
 */
function cleanText(value: string | undefined | null): string {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

/**
 * Checks if two URLs share the same registrable/normalized hostname (ignoring leading `www.`).
 */
function isSameDomain(hostnameA: string, hostnameB: string): boolean {
  const normA = hostnameA.toLowerCase().replace(/^www\./, "");
  const normB = hostnameB.toLowerCase().replace(/^www\./, "");
  return normA === normB;
}

/**
 * Performs a comprehensive live On-Page SEO & Keyword audit for the given `targetUrl`.
 */
export async function analyzeOnPageSEO(
  targetUrl: string
): Promise<SEOAuditResult> {
  const parsedTarget = new URL(targetUrl);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  const startTime = performance.now();
  let response: Response;
  let html: string;
  let responseTimeMs = 0;

  try {
    response = await fetch(parsedTarget.toString(), {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": DEFAULT_USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    });

    // Measure TTFB / response headers + body read time in ms
    const ttfbMs = Math.round(performance.now() - startTime);
    html = await response.text();
    responseTimeMs = ttfbMs > 0 ? ttfbMs : Math.round(performance.now() - startTime);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new SEOFetchError(
        `Request to ${parsedTarget.origin} timed out after ${FETCH_TIMEOUT_MS / 1000} seconds.`,
        504,
        "TIMEOUT"
      );
    }
    throw new SEOFetchError(
      `Failed to fetch ${parsedTarget.toString()}: ${
        err instanceof Error ? err.message : "Network error"
      }`,
      502,
      "NETWORK_ERROR"
    );
  } finally {
    clearTimeout(timeoutId);
  }

  const finalUrl = response.url || parsedTarget.toString();
  const baseUrl = new URL(finalUrl);
  const htmlSizeBytes = new TextEncoder().encode(html).length;

  // 1. Keyword Extraction & Density Engine (using raw HTML already fetched)
  const keywords = extractKeywordMetrics(html);

  const $ = cheerio.load(html);

  // 2. Title Tag Extraction & Validation (ideal: 20–65 chars)
  const titleText = cleanText($("head > title").first().text() || $("title").first().text());
  const titleLength = titleText.length;
  let titleStatus: MetaOverview["title"]["status"] = "optimal";
  if (titleLength === 0) {
    titleStatus = "missing";
  } else if (titleLength < 20) {
    titleStatus = "too_short";
  } else if (titleLength > 65) {
    titleStatus = "too_long";
  }

  // 3. Meta Description Extraction & Validation (ideal: 60–165 chars)
  const metaDescRaw =
    $('meta[name="description" i]').attr("content") ??
    $('meta[property="description" i]').attr("content") ??
    "";
  const descriptionContent = cleanText(metaDescRaw);
  const descriptionLength = descriptionContent.length;
  let descriptionStatus: MetaOverview["description"]["status"] = "optimal";
  if (descriptionLength === 0) {
    descriptionStatus = "missing";
  } else if (descriptionLength < 60) {
    descriptionStatus = "too_short";
  } else if (descriptionLength > 165) {
    descriptionStatus = "too_long";
  }

  // 4. Canonical URL Extraction & Validation
  const canonicalHref = cleanText($('link[rel="canonical" i]').first().attr("href"));
  let canonicalUrl: string | null = null;
  let canonicalIsValid = false;
  let canonicalIsSelfReferencing = false;

  if (canonicalHref) {
    try {
      const resolvedCanonical = new URL(canonicalHref, baseUrl);
      canonicalUrl = resolvedCanonical.toString();
      canonicalIsValid =
        resolvedCanonical.protocol === "http:" ||
        resolvedCanonical.protocol === "https:";
      canonicalIsSelfReferencing =
        resolvedCanonical.origin === baseUrl.origin &&
        resolvedCanonical.pathname.replace(/\/+$/, "") ===
          baseUrl.pathname.replace(/\/+$/, "");
    } catch {
      canonicalUrl = canonicalHref;
      canonicalIsValid = false;
    }
  }

  // 5. Robots Directive
  const robotsRaw =
    cleanText($('meta[name="robots" i]').attr("content")) ||
    cleanText($('meta[name="googlebot" i]').attr("content")) ||
    null;
  const robotsDirectives = robotsRaw
    ? robotsRaw
        .toLowerCase()
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean)
    : [];
  const isNoIndex =
    robotsDirectives.includes("noindex") || robotsDirectives.includes("none");
  const isNoFollow =
    robotsDirectives.includes("nofollow") || robotsDirectives.includes("none");

  // 6. OpenGraph & Twitter Cards
  const ogTitle =
    cleanText($('meta[property="og:title" i]').attr("content")) || null;
  const ogDescription =
    cleanText($('meta[property="og:description" i]').attr("content")) || null;
  const ogImage =
    cleanText($('meta[property="og:image" i]').attr("content")) || null;
  const twitterCard =
    cleanText($('meta[name="twitter:card" i]').attr("content")) ||
    cleanText($('meta[property="twitter:card" i]').attr("content")) ||
    null;
  const socialIsComplete = Boolean(
    ogTitle && ogDescription && ogImage && twitterCard
  );

  // 7. Structured Data (JSON-LD)
  const ldJsonNodes = $('script[type="application/ld+json" i]');
  const ldJsonTypes = new Set<string>();
  let ldJsonParseErrors = false;

  ldJsonNodes.each((_, el) => {
    const rawJson = $(el).html()?.trim();
    if (!rawJson) return;
    try {
      const parsed = JSON.parse(rawJson);
      extractJsonLdTypes(parsed, ldJsonTypes);
    } catch {
      ldJsonParseErrors = true;
    }
  });

  // 8. Heading Hierarchy (H1 - H6)
  const extractHeadingGroup = (tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"): HeadingGroup => {
    const items: string[] = [];
    $(tag).each((_, el) => {
      const text = cleanText($(el).text());
      if (text) {
        items.push(text);
      } else {
        items.push("[Empty Heading]");
      }
    });
    return {
      count: items.length,
      items,
    };
  };

  const h1 = extractHeadingGroup("h1");
  const h2 = extractHeadingGroup("h2");
  const h3 = extractHeadingGroup("h3");
  const h4 = extractHeadingGroup("h4");
  const h5 = extractHeadingGroup("h5");
  const h6 = extractHeadingGroup("h6");

  const headings: HeadingStructure = {
    h1,
    h2,
    h3,
    h4,
    h5,
    h6,
    totalHeadings:
      h1.count + h2.count + h3.count + h4.count + h5.count + h6.count,
    hasMissingH1: h1.count === 0,
    hasMultipleH1: h1.count > 1,
  };

  // 9. Image Accessibility
  let totalImages = 0;
  let withAltCount = 0;
  let missingAltCount = 0;
  let emptyAltCount = 0;
  const missingAltSources: string[] = [];

  $("img").each((_, el) => {
    totalImages += 1;
    const altAttr = $(el).attr("alt");
    const srcAttr =
      cleanText($(el).attr("src")) ||
      cleanText($(el).attr("data-src")) ||
      "[inline-or-missing-src]";

    if (typeof altAttr === "undefined") {
      missingAltCount += 1;
      if (missingAltSources.length < 15) {
        missingAltSources.push(srcAttr);
      }
    } else if (altAttr.trim() === "") {
      emptyAltCount += 1;
    } else {
      withAltCount += 1;
    }
  });

  const images: ImageAccessibilityReport = {
    totalCount: totalImages,
    withAltCount,
    missingAltCount,
    emptyAltCount,
    missingAltSources,
  };

  // 10. Link Architecture
  let totalLinks = 0;
  let internalCount = 0;
  let externalCount = 0;
  let nofollowCount = 0;
  const sampleInternalLinks: LinkItem[] = [];
  const sampleExternalLinks: LinkItem[] = [];

  $("a[href]").each((_, el) => {
    const rawHref = cleanText($(el).attr("href"));
    if (
      !rawHref ||
      rawHref.startsWith("#") ||
      rawHref.toLowerCase().startsWith("javascript:") ||
      rawHref.toLowerCase().startsWith("mailto:") ||
      rawHref.toLowerCase().startsWith("tel:")
    ) {
      return;
    }

    let resolvedUrl: URL;
    try {
      resolvedUrl = new URL(rawHref, baseUrl);
    } catch {
      return;
    }

    if (
      resolvedUrl.protocol !== "http:" &&
      resolvedUrl.protocol !== "https:"
    ) {
      return;
    }

    totalLinks += 1;
    const isInternal = isSameDomain(resolvedUrl.hostname, baseUrl.hostname);
    const relAttr = ($(el).attr("rel") || "").toLowerCase();
    const isNoFollow =
      relAttr.includes("nofollow") ||
      relAttr.includes("sponsored") ||
      relAttr.includes("ugc");
    const anchorText =
      cleanText($(el).text()) ||
      cleanText($(el).attr("aria-label")) ||
      "[No Anchor Text]";

    if (isNoFollow) {
      nofollowCount += 1;
    }

    const linkItem: LinkItem = {
      href: resolvedUrl.toString(),
      text: anchorText.slice(0, 100),
      isInternal,
      isNoFollow,
    };

    if (isInternal) {
      internalCount += 1;
      if (sampleInternalLinks.length < 10) {
        sampleInternalLinks.push(linkItem);
      }
    } else {
      externalCount += 1;
      if (sampleExternalLinks.length < 10) {
        sampleExternalLinks.push(linkItem);
      }
    }
  });

  const links: LinkArchitectureReport = {
    totalLinks,
    internalCount,
    externalCount,
    nofollowCount,
    dofollowCount: Math.max(0, totalLinks - nofollowCount),
    sampleInternalLinks,
    sampleExternalLinks,
  };

  // 11. Multi-Pillar Weighted SEO Health Score (0-100)
  // Modeled on Google Lighthouse & Enterprise SEO Audit standards
  let score = 0;
  const passedChecks: SEOPassedCheck[] = [];
  const actionableIssues: SEOIssue[] = [];

  // ==========================================
  // PILLAR 1: CRAWLABILITY & INDEXABILITY (Max: 25 pts)
  // ==========================================
  // 1A. HTTP Status Code (Max 10 pts)
  if (response.status === 200) {
    score += 10;
    passedChecks.push({
      id: "http-status-ok",
      category: "performance",
      message: "Server returned a healthy HTTP 200 OK status.",
      value: 200,
    });
  } else if (response.status >= 300 && response.status < 400) {
    score += 7;
    passedChecks.push({
      id: "http-status-redirect",
      category: "performance",
      message: `Page resolves via redirect (HTTP ${response.status}).`,
      value: response.status,
    });
  } else {
    actionableIssues.push({
      id: "http-status-error",
      category: "performance",
      severity: "critical",
      message: `Server returned non-success HTTP status code: ${response.status}.`,
      recommendation: "Ensure the page resolves with HTTP 200 OK to allow search engine bots to crawl content.",
      currentValue: response.status,
    });
  }

  // 1B. Robots Indexing Directives (Max 10 pts)
  if (isNoIndex) {
    actionableIssues.push({
      id: "robots-noindex",
      category: "meta",
      severity: "critical",
      message: "Page is blocked from Google search indexing by a 'noindex' robots directive.",
      recommendation: 'Remove "noindex" from <meta name="robots"> to permit indexing.',
      currentValue: robotsRaw,
    });
  } else {
    score += 10;
    passedChecks.push({
      id: "robots-indexable",
      category: "meta",
      message: "Page is indexable by search engines (no 'noindex' directive blocking crawlers).",
      value: robotsRaw ?? "index, follow (implicit)",
    });
  }

  // 1C. Canonical Configuration (Max 5 pts)
  if (canonicalUrl && canonicalIsValid) {
    score += 5;
    passedChecks.push({
      id: "canonical-valid",
      category: "meta",
      message: canonicalIsSelfReferencing
        ? "Valid self-referencing canonical tag configured."
        : "Valid canonical URL tag configured.",
      value: canonicalUrl,
    });
  } else if (!canonicalUrl) {
    score += 3; // Minor advisory only, not a critical failure
    actionableIssues.push({
      id: "canonical-missing",
      category: "meta",
      severity: "warning",
      message: 'Missing explicit <link rel="canonical"> tag.',
      recommendation: 'Add a self-referencing <link rel="canonical" href="..."> tag to prevent potential duplicate content dilution.',
      currentValue: null,
    });
  } else {
    actionableIssues.push({
      id: "canonical-invalid",
      category: "meta",
      severity: "critical",
      message: `Invalid canonical URL detected: "${canonicalUrl}".`,
      recommendation: "Ensure <link rel=\"canonical\"> contains a valid absolute HTTP or HTTPS URL.",
      currentValue: canonicalUrl,
    });
  }

  // ==========================================
  // PILLAR 2: CORE ON-PAGE METADATA (Max: 30 pts)
  // ==========================================
  // 2A. Title Tag Optimization (Max 15 pts)
  if (titleStatus === "optimal") {
    score += 15;
    passedChecks.push({
      id: "title-optimal",
      category: "meta",
      message: `Title tag length is optimal for SERP display (${titleLength} characters).`,
      value: titleText,
    });
  } else if (titleStatus === "too_short") {
    score += 10;
    actionableIssues.push({
      id: "title-too-short",
      category: "meta",
      severity: "warning",
      message: `Title tag is concise (${titleLength} chars; recommended: 20–65 chars).`,
      recommendation: "Consider expanding your title tag to 20–65 characters to maximize search click-through rate.",
      currentValue: titleLength,
    });
  } else if (titleStatus === "too_long") {
    score += 10;
    actionableIssues.push({
      id: "title-too-long",
      category: "meta",
      severity: "warning",
      message: `Title tag is ${titleLength} chars (Google truncates titles over ~65 chars).`,
      recommendation: "Shorten title tag to 65 characters or fewer to avoid ellipsis truncation in search results.",
      currentValue: titleLength,
    });
  } else {
    actionableIssues.push({
      id: "title-missing",
      category: "meta",
      severity: "critical",
      message: "Missing <title> tag in document <head>.",
      recommendation: "Add a descriptive, keyword-focused <title> tag between 20 and 65 characters.",
      currentValue: 0,
    });
  }

  // 2B. Meta Description (Max 15 pts)
  if (descriptionStatus === "optimal") {
    score += 15;
    passedChecks.push({
      id: "meta-description-optimal",
      category: "meta",
      message: `Meta description length is optimal (${descriptionLength} characters).`,
      value: descriptionContent,
    });
  } else if (descriptionStatus === "too_short") {
    score += 10;
    actionableIssues.push({
      id: "meta-description-too-short",
      category: "meta",
      severity: "warning",
      message: `Meta description is concise (${descriptionLength} chars; recommended: 60–165 chars).`,
      recommendation: "Expand meta description to 60–165 characters to provide richer context in search snippets.",
      currentValue: descriptionLength,
    });
  } else if (descriptionStatus === "too_long") {
    score += 10;
    actionableIssues.push({
      id: "meta-description-too-long",
      category: "meta",
      severity: "warning",
      message: `Meta description exceeds standard length (${descriptionLength} chars; recommended: 60–165 chars).`,
      recommendation: "Trim meta description to 165 characters or fewer to prevent truncation on mobile devices.",
      currentValue: descriptionLength,
    });
  } else {
    actionableIssues.push({
      id: "meta-description-missing",
      category: "meta",
      severity: "warning",
      message: 'Missing <meta name="description"> tag.',
      recommendation: "Add a compelling meta description between 60 and 165 characters summarizing the page's value.",
      currentValue: 0,
    });
  }

  // ==========================================
  // PILLAR 3: CONTENT STRUCTURE & HIERARCHY (Max: 20 pts)
  // ==========================================
  // 3A. Primary H1 Heading (Max 10 pts)
  if (!headings.hasMissingH1 && !headings.hasMultipleH1) {
    score += 10;
    passedChecks.push({
      id: "h1-optimal",
      category: "headings",
      message: "Single, clear primary <h1> heading detected.",
      value: h1.items[0],
    });
  } else if (headings.hasMultipleH1) {
    score += 8; // Multiple H1s is valid in HTML5 sectioning, minor advisory
    actionableIssues.push({
      id: "h1-multiple",
      category: "headings",
      severity: "warning",
      message: `Multiple <h1> headings found (${h1.count} detected).`,
      recommendation: "Prefer a single primary <h1> heading and structure secondary sections with <h2> or <h3>.",
      currentValue: h1.count,
    });
  } else {
    actionableIssues.push({
      id: "h1-missing",
      category: "headings",
      severity: "critical",
      message: "Page is missing a primary <h1> heading.",
      recommendation: "Include a clear <h1> tag stating the primary topic and target keyword of the page.",
      currentValue: 0,
    });
  }

  // 3B. Subheading Hierarchy (H2 / H3) (Max 5 pts)
  if (h2.count > 0 || h3.count > 0) {
    score += 5;
    passedChecks.push({
      id: "subheadings-present",
      category: "headings",
      message: `Logical subheading hierarchy present (${h2.count} <h2>, ${h3.count} <h3>).`,
      value: `${h2.count} h2 / ${h3.count} h3`,
    });
  } else {
    score += 2;
    actionableIssues.push({
      id: "h2-missing",
      category: "headings",
      severity: "warning",
      message: "No <h2> subheadings found to structure content sections.",
      recommendation: "Break content into clear topical sections using descriptive <h2> subheadings.",
      currentValue: 0,
    });
  }

  // 3C. Content Volume & App Recognition (Max 5 pts)
  const isInteractiveApp = $("form, input, button, select, canvas, textarea").length >= 2;
  if (keywords.totalWordCount >= 250 || isInteractiveApp) {
    score += 5;
    passedChecks.push({
      id: "content-depth-adequate",
      category: "keywords",
      message: isInteractiveApp
        ? `Interactive application elements verified (${keywords.totalWordCount} words parsed).`
        : `Adequate textual content volume (${keywords.totalWordCount} words parsed).`,
      value: `${keywords.totalWordCount} words`,
    });
  } else {
    score += 2;
    actionableIssues.push({
      id: "content-thin",
      category: "keywords",
      severity: "warning",
      message: `Low content volume detected (${keywords.totalWordCount} words parsed).`,
      recommendation: "Expand text to at least 250–400 words to give search engines sufficient topical context.",
      currentValue: `${keywords.totalWordCount} words`,
    });
  }

  // ==========================================
  // PILLAR 4: SEMANTIC ACCESSIBILITY & MOBILE (Max: 15 pts)
  // ==========================================
  // 4A. Mobile Viewport (Max 5 pts)
  const hasViewport = $('meta[name="viewport" i]').length > 0;
  if (hasViewport) {
    score += 5;
    passedChecks.push({
      id: "viewport-mobile-friendly",
      category: "meta",
      message: "Mobile viewport meta tag is configured for responsive rendering.",
      value: $('meta[name="viewport" i]').attr("content") ?? "configured",
    });
  } else {
    actionableIssues.push({
      id: "viewport-missing",
      category: "meta",
      severity: "critical",
      message: 'Missing <meta name="viewport"> tag.',
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> for mobile friendliness.',
      currentValue: null,
    });
  }

  // 4B. Image Accessibility (Alt tags) (Max 10 pts)
  if (totalImages === 0) {
    score += 10;
    passedChecks.push({
      id: "images-none-needed",
      category: "images",
      message: "No images found requiring alt attributes.",
      value: 0,
    });
  } else if (missingAltCount === 0) {
    score += 10;
    passedChecks.push({
      id: "images-alt-complete",
      category: "images",
      message: `All ${totalImages} image(s) include descriptive alt attributes.`,
      value: `${totalImages}/${totalImages} compliant`,
    });
  } else {
    const altRatio = (totalImages - missingAltCount) / totalImages;
    const imageScore = Math.max(2, Math.round(altRatio * 10));
    score += imageScore;
    actionableIssues.push({
      id: "images-missing-alt",
      category: "images",
      severity: missingAltCount >= 4 ? "critical" : "warning",
      message: `${missingAltCount} of ${totalImages} image(s) are missing an 'alt' attribute.`,
      recommendation: 'Add descriptive alt="..." tags to content images for accessibility and image search indexing.',
      currentValue: `${missingAltCount}/${totalImages} missing`,
    });
  }

  // ==========================================
  // PILLAR 5: PERFORMANCE, RICH SNIPPETS & SOCIAL (Max: 10 pts)
  // ==========================================
  // 5A. Server TTFB / Response Time (Max 5 pts)
  if (responseTimeMs <= 800) {
    score += 5;
    passedChecks.push({
      id: "response-time-fast",
      category: "performance",
      message: `Fast server response time (${responseTimeMs} ms; target < 800 ms).`,
      value: `${responseTimeMs} ms`,
    });
  } else if (responseTimeMs <= 1800) {
    score += 3;
    passedChecks.push({
      id: "response-time-acceptable",
      category: "performance",
      message: `Acceptable server response time (${responseTimeMs} ms).`,
      value: `${responseTimeMs} ms`,
    });
  } else {
    score += 1;
    actionableIssues.push({
      id: "response-time-slow",
      category: "performance",
      severity: "warning",
      message: `High server response latency (${responseTimeMs} ms; recommended: < 800 ms).`,
      recommendation: "Enable edge caching, CDN, or optimize server rendering to reduce Time to First Byte (TTFB).",
      currentValue: `${responseTimeMs} ms`,
    });
  }

  // 5B. Structured Data (JSON-LD) & Social Media Tags (Max 5 pts)
  const hasStructuredData = ldJsonNodes.length > 0 && !ldJsonParseErrors;
  const hasSocialTags = Boolean(ogTitle && (ogImage || twitterCard));

  if (hasStructuredData && hasSocialTags) {
    score += 5;
    passedChecks.push({
      id: "rich-metadata-complete",
      category: "structured-data",
      message: `Complete structured data (${Array.from(ldJsonTypes).join(", ") || "JSON-LD"}) and social cards verified.`,
      value: "JSON-LD + Social Cards",
    });
  } else if (hasStructuredData) {
    score += 4;
    passedChecks.push({
      id: "jsonld-present",
      category: "structured-data",
      message: `Structured data detected (${Array.from(ldJsonTypes).join(", ") || "JSON-LD"}).`,
      value: `${ldJsonNodes.length} block(s)`,
    });
  } else if (hasSocialTags) {
    score += 3;
    passedChecks.push({
      id: "social-tags-present",
      category: "social",
      message: "OpenGraph and Twitter cards configured for social sharing.",
      value: twitterCard ?? "OpenGraph",
    });
    actionableIssues.push({
      id: "jsonld-missing",
      category: "structured-data",
      severity: "warning",
      message: "No JSON-LD structured data (Schema.org) detected.",
      recommendation: "Add Schema.org markup (e.g., WebSite, SoftwareApplication, Organization) to qualify for rich snippets.",
      currentValue: 0,
    });
  } else {
    score += 1;
    actionableIssues.push({
      id: "jsonld-and-social-missing",
      category: "structured-data",
      severity: "warning",
      message: "Missing Schema.org structured data and complete social share tags.",
      recommendation: "Add JSON-LD and OpenGraph tags to improve SERP rich results and social share previews.",
      currentValue: null,
    });
  }

  // 5C. Internal Links Verification
  if (internalCount > 0) {
    passedChecks.push({
      id: "links-internal-present",
      category: "links",
      message: `Healthy link architecture with ${internalCount} internal and ${externalCount} external link(s).`,
      value: `${internalCount} internal / ${externalCount} external`,
    });
  } else {
    actionableIssues.push({
      id: "links-no-internal",
      category: "links",
      severity: "warning",
      message: "No internal crawlable links (<a href>) were found on the page.",
      recommendation: "Add contextual internal links pointing to related pages on your domain to improve crawl depth.",
      currentValue: 0,
    });
  }

  // Keyword Prominence (top 1-gram keyword check)
  if (keywords.oneGrams.length > 0) {
    const topTerm = keywords.oneGrams[0];
    if (topTerm.inTitle && (topTerm.inH1 || topTerm.inMetaDescription)) {
      passedChecks.push({
        id: "keyword-prominence-aligned",
        category: "keywords",
        message: `Primary keyword "${topTerm.term}" is prominently placed in key on-page zones.`,
        value: `${topTerm.term} (Density: ${topTerm.density}%)`,
      });
    }
  }

  // Sort issues so 'critical' items appear before 'warning'
  actionableIssues.sort((a, b) => {
    if (a.severity === b.severity) return 0;
    return a.severity === "critical" ? -1 : 1;
  });

  const seoScore = Math.max(0, Math.min(100, Math.round(score)));

  const meta: MetaOverview = {
    title: {
      text: titleText,
      length: titleLength,
      status: titleStatus,
      idealRange: { min: 20, max: 65 },
    },
    description: {
      content: descriptionContent,
      length: descriptionLength,
      status: descriptionStatus,
      idealRange: { min: 60, max: 165 },
    },
    canonical: {
      url: canonicalUrl,
      isValid: canonicalIsValid,
      isSelfReferencing: canonicalIsSelfReferencing,
    },
    robots: {
      raw: robotsRaw,
      directives: robotsDirectives,
      isNoIndex,
      isNoFollow,
    },
    social: {
      ogTitle,
      ogDescription,
      ogImage,
      twitterCard,
      isComplete: socialIsComplete,
    },
    structuredData: {
      blockCount: ldJsonNodes.length,
      types: Array.from(ldJsonTypes),
      hasParseErrors: ldJsonParseErrors,
    },
  };

  return {
    targetUrl: parsedTarget.toString(),
    finalUrl,
    fetchedAt: new Date().toISOString(),
    httpStatus: response.status,
    responseTimeMs,
    htmlSizeBytes,
    seoScore,
    meta,
    headings,
    images,
    links,
    keywords,
    passedChecks,
    actionableIssues,
  };
}
