# 🔒 Lock SEO — Local SEO & Competitor Analysis Toolkit

A high-precision, technical on-page SEO auditing, keyword frequency & density analysis, and competitor backlink intelligence toolkit built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS**.

---

## ⚡ Key Features

- **🛡️ 5-Pillar Weighted SEO Health Engine (100-Point Model)**:
  - **Crawlability & Indexability (25 pts)**: HTTP status code validation, robots.txt directives (`noindex`/`nofollow`), and canonical URL validation.
  - **Core On-Page Metadata (30 pts)**: Title tag optimization (20–65 chars) and meta description evaluation (60–165 chars).
  - **Content Structure & Hierarchy (20 pts)**: Single primary `<h1>` verification, `<h2>`/`<h3>` subheadings hierarchy, and interactive web application recognition (no unfair thin-content penalties for utility apps).
  - **Semantic Accessibility & Mobile (15 pts)**: Responsive `<meta name="viewport">` check and 100% `<img>` alt attribute coverage analysis.
  - **Performance, Rich Snippets & Delivery (10 pts)**: Real-time Time to First Byte (TTFB), Schema.org JSON-LD structured data, and OpenGraph/Twitter social cards.

- **📊 Clean N-Gram Keyword Density Engine**:
  - Extracts 1-word (single terms), 2-word (bigrams), and 3-word (trigrams) keyword frequencies and density percentages.
  - Strips currency expressions (`$250,000.00`), decimals, and zero-padded numbers so tables and prices don't pollute keywords.
  - Preserves legitimate technical alphanumeric terms (`ipv6`, `b2b`, `web3`, `4k`, `3d`, `win11`, `oauth2`).
  - **1-Click Dual Copy**: Copy ranked list with counts & densities, or clean comma-separated list (CSV) ready for Google Ads / spreadsheets.

- **🌐 Live Backlink Discovery & Domain Authority**:
  - Resilient 3-tier backlink discovery pipeline:
    - **Tier 1**: Common Crawl CDX Index API query for real indexed web references.
    - **Tier 2**: DuckDuckGo Lite search-operator parsing (`"${domain}" -site:${domain}`).
    - **Tier 3**: Verified structured developer & software footprint generator (GitHub, Reddit, StackOverflow, AlternativeTo, SaaSHub).
  - **Live Global Rank & Traffic Intelligence**: Dual integration with **OpenPageRank API** and **Tranco Top 1M Global Index** for genuine worldwide rank and realistic traffic tier estimation.

- **💾 Zero-Database Local Scan History**:
  - Persists full scan snapshots and health scores locally in the browser (`localStorage`).
  - 1-click instant audit restoration with zero network delay.

- **📥 Multi-Format Report Export**:
  - **JSON**: Full hierarchical audit payload with all technical metrics.
  - **Multi-Section CSV**: RFC-4180 compliant formatted spreadsheet report with executive summary, actionable issues, passed checks, and full keyword density tables.

- **🌓 Technical Engineering UI**:
  - Minimalist dark/light mode architecture matching modern developer tools.
  - Tabular monospace font (`JetBrains Mono`) for metrics, timings, and densities.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.17 or later recommended)
- **npm**, **pnpm**, or **yarn**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/MOwais-gujjar/lock-seo.git
   cd lock-seo
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional)**:
   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
   Add your free OpenPageRank API key (get 30,000 free domain queries/month at [openpagerank.keywordseverywhere.com](https://openpagerank.keywordseverywhere.com/dashboard)):
   ```env
   OPENPAGERANK_API_KEY=your_key_here
   ```
   *(Note: If no key is configured, Lock SEO automatically falls back to the live Tranco Top 1M Global Index with zero configuration).*

4. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm run start
   ```

---

## ☁️ Deploying to Cloudflare

Lock SEO is pre-configured with `@opennextjs/cloudflare` and `wrangler.jsonc` / `wrangler.toml` for seamless deployment to Cloudflare Workers and Cloudflare Pages.

### Option 1: Cloudflare Dashboard (GitHub Integration)
1. Go to your **Cloudflare Dashboard** -> **Workers & Pages** -> **Create application** -> **Pages** (or **Workers**).
2. Connect your GitHub repository (`lock-seo`).
3. Set the build configuration:
   - **Framework preset**: `None` or `Next.js`
   - **Build command**: `npx @opennextjs/cloudflare build` (or `npm run build:worker`)
   - **Deploy command / Output directory**:
     - For Cloudflare Workers: `npx @opennextjs/cloudflare deploy`
     - For Cloudflare Pages: Build output directory `.open-next/assets`
   - **Compatibility flags**: `nodejs_compat, global_fetch_strictly_public`
   - **Compatibility date**: `2025-02-01`
4. In **Settings -> Environment variables**, add:
   - `OPENPAGERANK_API_KEY`: *(Your OpenPageRank API key)*

### Option 2: Deploy from CLI with Wrangler
```bash
npm run build:worker
npx wrangler deploy
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router + Turbopack)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **DOM & HTML Parser**: [Cheerio](https://cheerio.js.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Image Processing**: [Sharp](https://sharp.pixelplumbing.com/)

---

## 📄 License

MIT License. Free for personal and commercial use.
