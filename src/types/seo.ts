export type IssueSeverity = "critical" | "warning";

export type AuditCategory =
  | "meta"
  | "headings"
  | "social"
  | "structured-data"
  | "images"
  | "links"
  | "performance"
  | "keywords";

export interface SEOIssue {
  id: string;
  category: AuditCategory;
  severity: IssueSeverity;
  message: string;
  recommendation: string;
  currentValue?: string | number | null;
}

export interface SEOPassedCheck {
  id: string;
  category: AuditCategory;
  message: string;
  value?: string | number | null;
}

export interface MetaOverview {
  title: {
    text: string;
    length: number;
    status: "optimal" | "too_short" | "too_long" | "missing";
    idealRange: { min: number; max: number };
  };
  description: {
    content: string;
    length: number;
    status: "optimal" | "too_short" | "too_long" | "missing";
    idealRange: { min: number; max: number };
  };
  canonical: {
    url: string | null;
    isValid: boolean;
    isSelfReferencing: boolean;
  };
  robots: {
    raw: string | null;
    directives: string[];
    isNoIndex: boolean;
    isNoFollow: boolean;
  };
  social: {
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    twitterCard: string | null;
    isComplete: boolean;
  };
  structuredData: {
    blockCount: number;
    types: string[];
    hasParseErrors: boolean;
  };
}

export interface HeadingGroup {
  count: number;
  items: string[];
}

export interface HeadingStructure {
  h1: HeadingGroup;
  h2: HeadingGroup;
  h3: HeadingGroup;
  h4: HeadingGroup;
  h5: HeadingGroup;
  h6: HeadingGroup;
  totalHeadings: number;
  hasMissingH1: boolean;
  hasMultipleH1: boolean;
}

export interface ImageAccessibilityReport {
  totalCount: number;
  withAltCount: number;
  missingAltCount: number;
  emptyAltCount: number;
  missingAltSources: string[];
}

export interface LinkItem {
  href: string;
  text: string;
  isInternal: boolean;
  isNoFollow: boolean;
}

export interface LinkArchitectureReport {
  totalLinks: number;
  internalCount: number;
  externalCount: number;
  nofollowCount: number;
  dofollowCount: number;
  sampleInternalLinks: LinkItem[];
  sampleExternalLinks: LinkItem[];
}

export interface KeywordMetric {
  term: string;
  count: number;
  density: number;
  inTitle: boolean;
  inH1: boolean;
  inMetaDescription: boolean;
}

export interface KeywordAnalysisResult {
  totalWordCount: number;
  uniqueWordCount: number;
  oneGrams: KeywordMetric[];
  twoGrams: KeywordMetric[];
  threeGrams: KeywordMetric[];
}

export interface BacklinkItem {
  sourceUrl: string;
  sourceDomain: string;
  title: string;
  snippet: string;
  anchorHint: string;
  linkType: "DoFollow" | "NoFollow" | "Mention";
  platformCategory: "Community/Forum" | "Code/Docs" | "Directory" | "Blog/Web";
}

export interface DomainAuthorityMetrics {
  domain: string;
  pageRankDecimal: number; // 0 to 10 scale (from OpenPageRank or Tranco Index)
  pageRankInteger: number; // 0 to 10 rounded
  globalRank: string | null;
  source: "OpenPageRank API" | "Tranco Global Index" | "Heuristic Fallback";
  estimatedMonthlyTraffic: string;
  trafficTier: "Low" | "Growing" | "High" | "Authority";
}

export interface BacklinkAnalysisResult {
  domain: string;
  authority: DomainAuthorityMetrics;
  totalFound: number;
  backlinks: BacklinkItem[];
  queryUsed: string;
}

export interface ScanHistoryItem {
  url: string;
  domain: string;
  score: number;
  timestamp: string;
}

export interface FullScanHistoryItem {
  id: string;
  url: string;
  domain: string;
  score: number;
  timestamp: string;
  seoResult: SEOAuditResult;
  backlinkResult: BacklinkAnalysisResult | null;
}

export interface SEOAuditResult {
  targetUrl: string;
  finalUrl: string;
  fetchedAt: string;
  httpStatus: number;
  responseTimeMs: number;
  htmlSizeBytes: number;
  seoScore: number;
  meta: MetaOverview;
  headings: HeadingStructure;
  images: ImageAccessibilityReport;
  links: LinkArchitectureReport;
  keywords: KeywordAnalysisResult;
  passedChecks: SEOPassedCheck[];
  actionableIssues: SEOIssue[];
}
