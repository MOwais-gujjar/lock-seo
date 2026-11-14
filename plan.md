SEO Radar — Next.js Implementation Plan

Phase 1: Foundation & Setup

Step 1: Next.js Project Scaffolding & Setup

Initialize Next.js App Router with TypeScript and Tailwind CSS.

Install cheerio and lucide-react.

Set up folder structure (src/types, src/lib, src/components, src/app/api) and configure dark/light mode (#090D16 dark slate + cyan/emerald accents).

Phase 2: Backend Intelligence Engines

Step 2: On-Page SEO Engine (src/lib/seo-analyzer.ts & /api/analyze)

Fetch target URL HTML with browser headers and measure response time.

Parse Title, Meta Description, Canonical, Robots, H1–H6 structure, OpenGraph, JSON-LD Schema, Image Alts, and Internal/Outbound links.

Generate a weighted SEO Score (0–100) and prioritized fix recommendations.

Step 3: Keyword Extraction & Density Engine (src/lib/keyword-extractor.ts)

Strip scripts, styles, and navigation noise from the DOM.

Filter English stop-words and compute 1-word, 2-word (bigrams), and 3-word (trigrams) frequencies and density percentages.

Attach keyword metrics directly to the /api/analyze response.

Step 4: Backlink Discovery & Authority Module (src/lib/backlink-finder.ts & /api/backlinks)

Implement automated public mention/search-operator parsing ("<domain>" -site:<domain>) to uncover forum, GitHub, and blog backlinks.

Connect optional free OpenPageRank / Common Crawl metrics for domain strength scoring.

Phase 3: Frontend Dashboard & UX

Step 5: Dashboard UI & Theme Architecture (src/components/*)

Build modular React client components: Header, AuditForm, ScoreOverview, IssueList, KeywordTable, and BacklinkDeck.

Implement seamless dark/light mode switching matching the OnMyPort brand identity.

Step 6: State Management & Full Integration (src/app/page.tsx)

Connect UI components to /api/analyze and /api/backlinks using concurrent Promise.allSettled fetching.

Add loading skeletons, error alerts, and tabbed navigation between On-Page Audit, Keywords, and Backlinks.

Phase 4: Verification & Export

Step 7: End-to-End Testing & Report Export (src/components/ExportButton.tsx)

Run live audits against <https://onmyport.com> and <https://portchecker.co>.

Implement one-click CSV and JSON audit report downloads for offline comparison.
