"use client";

import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { AuditForm } from "@/components/AuditForm";
import { RecentScans, recordFullScanInHistory, getLatestStoredScan } from "@/components/RecentScans";
import { ScoreOverview } from "@/components/ScoreOverview";
import { AuditChecklist } from "@/components/AuditChecklist";
import { KeywordTable } from "@/components/KeywordTable";
import { BacklinkDeck } from "@/components/BacklinkDeck";
import { ExportBar } from "@/components/ExportBar";
import { Footer } from "@/components/Footer";
import {
  AlertCircle,
  Lock,
  FileSearch,
  BarChart3,
  Link2,
  Cpu,
  RefreshCw,
  Terminal,
  Globe,
  RotateCw,
} from "lucide-react";
import type { BacklinkAnalysisResult, FullScanHistoryItem, SEOAuditResult } from "@/types/seo";

export default function DashboardPage() {
  const [targetUrl, setTargetUrl] = useState<string>("https://portchecker.co");
  const [auditResult, setAuditResult] = useState<SEOAuditResult | null>(null);
  const [backlinksResult, setBacklinksResult] = useState<BacklinkAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBacklinksLoading, setIsBacklinksLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [backlinkError, setBacklinkError] = useState<string | null>(null);

  // Restore latest scan from localStorage after mount so dashboard is never blank on refresh
  useEffect(() => {
    const timer = setTimeout(() => {
      const latest = getLatestStoredScan();
      if (latest) {
        setTargetUrl(latest.url);
        setAuditResult(latest.seoResult);
        setBacklinksResult(latest.backlinkResult);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Main audit execution orchestrator running analyze & backlinks concurrently.
   */
  const handleRunAudit = async (overrideUrl?: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const url = (overrideUrl || targetUrl).trim();
    if (!url) return;

    if (overrideUrl) {
      setTargetUrl(overrideUrl);
    }

    setIsLoading(true);
    setIsBacklinksLoading(true);
    setErrorMessage(null);
    setBacklinkError(null);

    try {
      const [analyzeSettled, backlinksSettled] = await Promise.allSettled([
        fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.error || `On-page SEO audit failed with HTTP ${res.status}`);
          }
          return data as SEOAuditResult;
        }),
        fetch("/api/backlinks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        }).then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data?.error || `Backlink discovery failed with HTTP ${res.status}`);
          }
          return data as BacklinkAnalysisResult;
        }),
      ]);

      let resolvedSeo: SEOAuditResult | null = null;
      let resolvedBacklinks: BacklinkAnalysisResult | null = null;

      if (analyzeSettled.status === "fulfilled") {
        resolvedSeo = analyzeSettled.value;
        setAuditResult(resolvedSeo);
      } else {
        setErrorMessage(
          analyzeSettled.reason instanceof Error
            ? analyzeSettled.reason.message
            : "Failed to connect to target URL for SEO analysis."
        );
        setAuditResult(null);
      }

      if (backlinksSettled.status === "fulfilled") {
        resolvedBacklinks = backlinksSettled.value;
        setBacklinksResult(resolvedBacklinks);
        setBacklinkError(null);
      } else {
        setBacklinksResult(null);
        setBacklinkError(
          backlinksSettled.reason instanceof Error
            ? backlinksSettled.reason.message
            : "Search operator backlink discovery was throttled."
        );
      }

      // Persist full snapshot if SEO audit was successful
      if (resolvedSeo) {
        recordFullScanInHistory({
          url: resolvedSeo.targetUrl,
          domain: resolvedSeo.targetUrl,
          score: resolvedSeo.seoScore,
          timestamp: new Date().toISOString(),
          seoResult: resolvedSeo,
          backlinkResult: resolvedBacklinks,
        });
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected application error occurred."
      );
    } finally {
      setIsLoading(false);
      setIsBacklinksLoading(false);
    }
  };

  /**
   * Restores a full previous scan from localStorage instantly.
   */
  const handleRestoreScan = (item: FullScanHistoryItem) => {
    setTargetUrl(item.url);
    setAuditResult(item.seoResult);
    setBacklinksResult(item.backlinkResult);
    setErrorMessage(null);
    setBacklinkError(null);
  };

  /**
   * Non-blocking retry handler specifically for backlink discovery.
   */
  const handleRetryBacklinks = async () => {
    const url = auditResult?.targetUrl || targetUrl;
    if (!url) return;

    setIsBacklinksLoading(true);
    setBacklinkError(null);

    try {
      const res = await fetch("/api/backlinks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `Backlink discovery returned HTTP ${res.status}`);
      }
      setBacklinksResult(data);

      if (auditResult) {
        recordFullScanInHistory({
          url: auditResult.targetUrl,
          domain: auditResult.targetUrl,
          score: auditResult.seoScore,
          timestamp: new Date().toISOString(),
          seoResult: auditResult,
          backlinkResult: data,
        });
      }
    } catch (err) {
      setBacklinkError(
        err instanceof Error ? err.message : "Failed to retrieve backlink citations."
      );
    } finally {
      setIsBacklinksLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors selection:bg-accent selection:text-accent-foreground">
      {/* Brand Navbar */}
      <Navbar />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Form Container & Recent History */}
        <div className="space-y-3">
          <AuditForm
            targetUrl={targetUrl}
            setTargetUrl={setTargetUrl}
            onSubmit={(e) => handleRunAudit(undefined, e)}
            isLoading={isLoading}
          />

          {/* Local Scan History Pill Bar with Instant Restore */}
          <RecentScans
            currentUrl={auditResult?.targetUrl || targetUrl}
            disabled={isLoading}
            onRestore={handleRestoreScan}
            onRescan={(url) => handleRunAudit(url)}
          />
        </div>

        {/* Global Error Alert Banner */}
        {errorMessage && (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-danger flex items-start justify-between gap-3 shadow-xs animate-in fade-in duration-300">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" aria-hidden="true" />
              <div className="text-xs font-mono">
                <strong className="font-bold block text-sm font-sans mb-0.5">
                  Audit Execution Blocked
                </strong>
                <span>{errorMessage}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRunAudit()}
              className="px-3 py-1.5 rounded-lg bg-danger/20 hover:bg-danger/30 text-xs font-mono font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 text-danger"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Retry Audit</span>
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-44 rounded-2xl bg-surface border border-border" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 rounded-2xl bg-surface border border-border" />
              <div className="h-96 rounded-2xl bg-surface border border-border" />
            </div>
            <div className="h-80 rounded-2xl bg-surface border border-border" />
          </div>
        )}

        {/* Active Audit Results Section */}
        {!isLoading && auditResult && (
          <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header Dashboard Action Bar with URL, Status, Re-Scan, and Export */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
              <div className="flex items-center gap-2 text-xs font-mono text-muted">
                <Globe className="w-4 h-4 text-accent" aria-hidden="true" />
                <span className="text-foreground font-semibold truncate max-w-xs sm:max-w-md">
                  {auditResult.finalUrl}
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">HTTP {auditResult.httpStatus}</span>
              </div>

              {/* Action Controls: Live Re-Scan & Universal Export */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleRunAudit(auditResult.targetUrl)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-muted text-xs font-mono font-medium text-foreground transition-all cursor-pointer shadow-xs hover:border-accent/40 active:scale-[0.98] disabled:opacity-50"
                  title="Re-run live audit for current target"
                >
                  <RotateCw className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                  <span>Re-Scan Live</span>
                </button>

                <ExportBar seoData={auditResult} backlinkData={backlinksResult} />
              </div>
            </div>

            {/* 1. Score & Metrics Overview Deck */}
            <ScoreOverview audit={auditResult} backlinks={backlinksResult} />

            {/* 2. On-Page SEO Checklist (Issues vs Passed) */}
            <AuditChecklist audit={auditResult} />

            {/* 3. Keyword Density & N-Gram Distribution */}
            <KeywordTable keywords={auditResult.keywords} />

            {/* 4. Referring Backlink & Authority Explorer */}
            <BacklinkDeck
              backlinks={backlinksResult}
              isLoading={isBacklinksLoading}
              error={backlinkError}
              onRetry={handleRetryBacklinks}
            />
          </div>
        )}

        {/* Initial Empty State / Technical Architecture Guide */}
        {!isLoading && !auditResult && (
          <div className="space-y-8 py-6">
            <div className="rounded-2xl border border-border bg-surface p-8 text-center relative overflow-hidden">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent mx-auto mb-4 shadow-sm">
                <Lock className="w-7 h-7" aria-hidden="true" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">
                Lock SEO Engine Ready for Deep Crawl
              </h2>
              <p className="text-xs text-muted max-w-lg mx-auto mt-2 leading-relaxed">
                Enter any target URL above or click one of the quick test presets to execute a comprehensive DOM audit, extract 1/2/3-word n-gram keyword densities, and map referring domains.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                  <FileSearch className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold text-foreground font-sans">1. Live DOM Validation</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Fetches origin HTML with real browser headers, measures TTFB, audits heading hierarchies (&lt;h1&gt;–&lt;h6&gt;), meta tags, canonicals, schema JSON-LD, and image alt accessibility.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/30 flex items-center justify-center text-success">
                  <BarChart3 className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold text-foreground font-sans">2. N-Gram NLP Extraction</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Strips non-content noise tags, applies stop-word tokenization, and computes sentence-bounded 1-word, 2-word (bigram), and 3-word (trigram) density ratios with title/H1 prominence badges.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                  <Link2 className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-sm font-bold text-foreground font-sans">3. Multi-Tier Backlink Pipeline</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Queries Common Crawl CDX indexes, DuckDuckGo Lite operators, and structured footprints to guarantee resilient, comprehensive referring domain intelligence.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-muted border border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-muted">
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent" aria-hidden="true" />
                Stack: Next.js 16 App Router • Tailwind CSS • Cheerio • TypeScript
              </span>
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" aria-hidden="true" />
                API: /api/analyze &amp; /api/backlinks
              </span>
            </div>
          </div>
        )}
      </main>

      {/* Minimal Sleek Production Footer */}
      <Footer />
    </div>
  );
}
