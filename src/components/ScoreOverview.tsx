"use client";

import React from "react";
import { Zap, ShieldCheck, FileText, ExternalLink, Link2, Gauge, TrendingUp, Users } from "lucide-react";
import type { BacklinkAnalysisResult, SEOAuditResult } from "@/types/seo";

interface ScoreOverviewProps {
  audit: SEOAuditResult;
  backlinks: BacklinkAnalysisResult | null;
}

export function ScoreOverview({ audit, backlinks }: ScoreOverviewProps) {
  const score = audit.seoScore;

  // Determine dynamic health score colors
  let ringColor = "stroke-danger text-danger";
  let scoreBadgeColor = "bg-danger/10 text-danger border-danger/30";
  let scoreLabel = "Needs Immediate Attention";

  if (score >= 80) {
    ringColor = "stroke-success text-success";
    scoreBadgeColor = "bg-success/10 text-success border-success/30";
    scoreLabel = "Excellent Health";
  } else if (score >= 60) {
    ringColor = "stroke-warning text-warning";
    scoreBadgeColor = "bg-warning/10 text-warning border-warning/30";
    scoreLabel = "Moderate Issues Found";
  }

  // SVG Circular progress math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * score) / 100;

  // Response time rating
  const ttfb = audit.responseTimeMs;
  let ttfbStatus = { label: "Optimal", color: "text-success bg-success/10 border-success/30" };
  if (ttfb > 1500) {
    ttfbStatus = { label: "Slow TTFB", color: "text-danger bg-danger/10 border-danger/30" };
  } else if (ttfb > 800) {
    ttfbStatus = { label: "Average", color: "text-warning bg-warning/10 border-warning/30" };
  }

  const pageRankDecimal = backlinks?.authority?.pageRankDecimal ?? 0;
  const globalRank = backlinks?.authority?.globalRank ?? "Unranked";
  const oprSource = backlinks?.authority?.source ?? "Scanning Index...";
  const estimatedTraffic = backlinks?.authority?.estimatedMonthlyTraffic ?? "Analyzing Signals...";
  const trafficTier = backlinks?.authority?.trafficTier ?? "Low";

  let tierBadgeColor = "bg-surface-muted text-muted border-border";
  if (trafficTier === "Authority") {
    tierBadgeColor = "bg-accent/15 text-accent border-accent/40 font-bold";
  } else if (trafficTier === "High") {
    tierBadgeColor = "bg-success/15 text-success border-success/40 font-bold";
  } else if (trafficTier === "Growing") {
    tierBadgeColor = "bg-cyan-500/15 text-cyan-400 border-cyan-500/40 font-semibold";
  }

  return (
    <section aria-label="Executive Performance Summary" className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
          <Gauge className="w-4 h-4 text-accent" aria-hidden="true" />
          <span>Core Signals &amp; Authority Metrics</span>
        </h2>
        <span className="text-xs font-mono text-muted">
          Scanned: {new Date(audit.fetchedAt).toLocaleTimeString()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Circular SEO Health Gauge */}
        <div className="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-muted uppercase">SEO Health</span>
            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${scoreBadgeColor}`}>
              {scoreLabel}
            </span>
          </div>

          <div className="my-3 flex items-center justify-center relative">
            <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-border/40"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={`${ringColor} transition-all duration-1000 ease-out`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold font-mono tracking-tight text-foreground">
                {score}
              </span>
              <span className="text-[10px] font-mono text-muted uppercase">Score / 100</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-center text-muted">
            {audit.passedChecks.length} Passed • {audit.actionableIssues.length} Issues
          </div>
        </div>

        {/* Card 2: Estimated Monthly Traffic */}
        <div className="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-muted uppercase">Est. Monthly Traffic</span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded border ${tierBadgeColor}`}>
              {trafficTier} Tier
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-foreground">
                {estimatedTraffic.replace(" / mo", "")}
              </span>
              <span className="text-xs font-mono text-muted">visits / mo</span>
            </div>
            <p className="text-xs text-muted mt-2">
              Modeled organic monthly search volume from PageRank curve &amp; footprint footprint.
            </p>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-success" aria-hidden="true" />
              Volume Model
            </span>
            <span className="flex items-center gap-1 font-semibold text-foreground">
              <Users className="w-3 h-3 text-accent" aria-hidden="true" />
              Active
            </span>
          </div>
        </div>

        {/* Card 3: Domain Authority & PageRank */}
        <div className="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-muted uppercase">Authority Rank</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-muted border border-border text-muted">
              {oprSource === "OpenPageRank API" ? "OPR Verified" : "Calculated"}
            </span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono tracking-tight text-accent">
                {pageRankDecimal.toFixed(1)}
              </span>
              <span className="text-sm font-mono text-muted">/ 10.0</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-mono text-muted">
              <span>Global Rank:</span>
              <span className="text-foreground font-semibold">{globalRank}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
              Source
            </span>
            <span className="truncate max-w-[130px]">{oprSource}</span>
          </div>
        </div>

        {/* Card 4: Architecture & Response Time */}
        <div className="rounded-2xl border border-border bg-surface p-5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-muted uppercase">Architecture &amp; TTFB</span>
            <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${ttfbStatus.color}`}>
              {ttfb} ms
            </span>
          </div>

          <div className="my-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
                Parsed Words:
              </span>
              <span className="font-bold text-foreground">{audit.keywords.totalWordCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-success" aria-hidden="true" />
                Internal Links:
              </span>
              <span className="font-bold text-foreground">{audit.links.internalCount}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-muted flex items-center gap-1.5">
                <ExternalLink className="w-3.5 h-3.5 text-muted" aria-hidden="true" />
                Outbound Links:
              </span>
              <span className="font-bold text-foreground">{audit.links.externalCount}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs font-mono text-muted">
            <span className="flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-warning" aria-hidden="true" />
              Payload
            </span>
            <span className="font-semibold text-foreground">
              {(audit.htmlSizeBytes / 1024).toFixed(1)} KB
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
