SEO Radar (OnMyPort Local Toolkit) — Next.js System Structure1. Tech Stack & Core EnginesFramework: Next.js 14/15 (App Router, Full-Stack TypeScript)Styling & UI: Tailwind CSS (Class-based Dark/Light Mode), lucide-react iconsDOM & On-Page Parser: cheerio (Sub-second HTML extraction & tag validation)Backlink & Authority Engine: Search Operator Aggregator ("<domain>" -site:<domain>) + OpenPageRank API (Common Crawl authority metrics)2. Directory & File Architectureseo-radar/
├── package.json                     # Next.js, Cheerio, Lucide-React dependencies
├── next.config.ts                   # Next.js configuration
├── tailwind.config.ts               # Dark/Light theme tokens (#090D16, cyan/emerald accents)
├── .env.local                       # Optional API keys (OpenPageRank / RapidAPI)
└── src/
    ├── types/
    │   └── seo.ts                   # Shared TypeScript interfaces (AuditResult, Keyword, Backlink)
    ├── lib/
    │   ├── seo-analyzer.ts          # Cheerio on-page SEO audit & health score calculator
    │   ├── keyword-extractor.ts     # Stop-word filter & 1/2/3-gram density engine
    │   └── backlink-finder.ts       # Search operator scraper & domain authority fetcher
    ├── app/
    │   ├── api/
    │   │   ├── analyze/
    │   │   │   └── route.ts         # POST /api/analyze (On-Page SEO + Keywords)
    │   │   └── backlinks/
    │   │       └── route.ts         # POST /api/backlinks (Referring links + Authority)
    │   ├── globals.css              # Tailwind directives & custom scrollbar/theme rules
    │   ├── layout.tsx               # Root layout, dark/light provider & metadata
    │   └── page.tsx                 # Main interactive SEO dashboard shell
    └── components/
        ├── Header.tsx               # Brand header (OnMyPort logo + Dark/Light toggle)
        ├── AuditForm.tsx            # URL input bar & real-time scan trigger
        ├── ScoreOverview.tsx        # Health score gauge, TTFB speed & word count cards
        ├── IssueList.tsx            # Actionable SEO fix recommendations vs. passed checks
        ├── KeywordTable.tsx         # Filterable 1-word, 2-word & 3-word density table
        ├── BacklinkDeck.tsx         # Referring domains, anchor text & authority view
        └── ExportButton.tsx         # Client-side CSV / JSON report generator
3. API ContractsEndpointMethodRequest BodyResponse Payload/api/analyzePOST{ "url": "<https://onmyport.com>" }SEOAuditResult (Score, Meta, Headings, Issues, Keywords)/api/backlinksPOST{ "domain": "portchecker.co" }BacklinkReport (Domain Authority, Referring URLs, Anchors)
