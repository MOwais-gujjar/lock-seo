"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileCode,
  ArrowRight,
} from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import type { SEOAuditResult } from "@/types/seo";

interface AuditChecklistProps {
  audit: SEOAuditResult;
}

export function AuditChecklist({ audit }: AuditChecklistProps) {
  const [showMetadataRaw, setShowMetadataRaw] = useState(false);

  const { actionableIssues, passedChecks, meta, headings } = audit;

  const allRecommendationsText = actionableIssues
    .map(
      (issue, i) =>
        `${i + 1}. [${issue.severity.toUpperCase()}] ${issue.message}\n   Recommendation: ${issue.recommendation}`
    )
    .join("\n\n");

  const jsonLdString = JSON.stringify(meta.structuredData.types, null, 2);

  return (
    <section aria-label="On-Page Technical Audit Checklist" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Actionable Issues */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" aria-hidden="true" />
                <h3 className="text-base font-bold text-foreground font-sans">
                  Actionable Issues &amp; Fixes
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {actionableIssues.length > 0 && (
                  <CopyButton
                    text={allRecommendationsText}
                    label="Copy Fix Recommendations"
                    className="px-2.5 py-1 rounded-lg border bg-surface text-[11px] font-medium shadow-xs"
                  />
                )}
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-muted border border-border text-muted">
                  {actionableIssues.length} Detected
                </span>
              </div>
            </div>

            {actionableIssues.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mb-3">
                  <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
                </div>
                <h4 className="text-sm font-bold text-foreground font-sans">
                  Zero Critical or Warning Issues Found
                </h4>
                <p className="text-xs text-muted max-w-xs mt-1">
                  All foundational on-page SEO, robots directives, and heading requirements passed successfully.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-[580px] overflow-y-auto pr-1">
                {actionableIssues.map((issue) => (
                  <div key={issue.id} className="py-4 space-y-2 group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        {issue.severity === "critical" ? (
                          <XCircle className="w-4 h-4 text-danger mt-0.5 shrink-0" aria-hidden="true" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" aria-hidden="true" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-foreground leading-snug">
                              {issue.message}
                            </p>
                            <CopyButton
                              text={`${issue.message} - Fix: ${issue.recommendation}`}
                              iconOnly
                              title="Copy issue details"
                              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                          <span className="text-[10px] font-mono text-muted uppercase tracking-wider">
                            Category: {issue.category}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded shrink-0 border ${
                          issue.severity === "critical"
                            ? "bg-danger/10 text-danger border-danger/30"
                            : "bg-warning/10 text-warning border-warning/30"
                        }`}
                      >
                        {issue.severity}
                      </span>
                    </div>

                    <div className="ml-6.5 p-2.5 rounded-lg bg-surface-muted border border-border/80 text-xs">
                      <div className="flex items-start gap-1.5 text-muted">
                        <ArrowRight className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" aria-hidden="true" />
                        <span className="text-[11px] leading-relaxed text-foreground/90 font-mono">
                          <strong className="text-accent font-semibold">Recommended Fix:</strong>{" "}
                          {issue.recommendation}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Passed Checks & Raw DOM Preview */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
                <h3 className="text-base font-bold text-foreground font-sans">
                  Passed Validations
                </h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-success/10 border border-success/30 text-success">
                {passedChecks.length} Verified
              </span>
            </div>

            <div className="divide-y divide-border/60 max-h-[440px] overflow-y-auto pr-1">
              {passedChecks.map((check) => (
                <div key={check.id} className="py-3 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground font-medium leading-snug">
                      {check.message}
                    </p>
                    {check.value && (
                      <p className="text-[11px] font-mono text-muted truncate mt-0.5">
                        Value: <span className="text-foreground/80">{String(check.value)}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expandable Raw Metadata Drawer with Copy Buttons */}
          <div className="mt-4 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setShowMetadataRaw(!showMetadataRaw)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-surface-muted hover:bg-border/60 text-xs font-mono text-muted hover:text-foreground transition-colors cursor-pointer border border-border"
            >
              <span className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-accent" aria-hidden="true" />
                <span>Raw Extracted Metadata &amp; Schema ({meta.structuredData.types.length} schemas)</span>
              </span>
              {showMetadataRaw ? (
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {showMetadataRaw && (
              <div className="mt-3 p-4 rounded-xl bg-surface-muted border border-border text-xs font-mono space-y-3 max-h-80 overflow-y-auto">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-muted block text-[10px] uppercase font-semibold">Title Tag:</span>
                    <span className="text-foreground">{meta.title.text || "[None]"}</span>
                  </div>
                  {meta.title.text && <CopyButton text={meta.title.text} iconOnly title="Copy Title" />}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-muted block text-[10px] uppercase font-semibold">Meta Description:</span>
                    <span className="text-foreground">{meta.description.content || "[None]"}</span>
                  </div>
                  {meta.description.content && (
                    <CopyButton text={meta.description.content} iconOnly title="Copy Meta Description" />
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-muted block text-[10px] uppercase font-semibold">Canonical URL:</span>
                    <span className="text-foreground break-all">{meta.canonical.url || "[None]"}</span>
                  </div>
                  {meta.canonical.url && (
                    <CopyButton text={meta.canonical.url} iconOnly title="Copy Canonical URL" />
                  )}
                </div>

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-muted block text-[10px] uppercase font-semibold">Primary &lt;h1&gt; Heading:</span>
                    <span className="text-foreground">{headings.h1.items[0] || "[Missing]"}</span>
                  </div>
                  {headings.h1.items[0] && (
                    <CopyButton text={headings.h1.items[0]} iconOnly title="Copy Primary H1" />
                  )}
                </div>

                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">Robots Content:</span>
                  <span className="text-foreground">{meta.robots.raw || "index, follow (implicit)"}</span>
                </div>

                <div>
                  <span className="text-muted block text-[10px] uppercase font-semibold">OpenGraph &amp; Twitter:</span>
                  <div className="text-[11px] text-foreground space-y-0.5">
                    <div>og:title = {meta.social.ogTitle || "N/A"}</div>
                    <div>og:image = {meta.social.ogImage || "N/A"}</div>
                    <div>twitter:card = {meta.social.twitterCard || "N/A"}</div>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2 pt-1 border-t border-border/60">
                  <div className="flex-1 min-w-0">
                    <span className="text-muted block text-[10px] uppercase font-semibold">JSON-LD Schema Types:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {meta.structuredData.types.length > 0 ? (
                        meta.structuredData.types.map((type) => (
                          <span
                            key={type}
                            className="px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent text-[11px]"
                          >
                            {type}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted italic">No Schema.org blocks found</span>
                      )}
                    </div>
                  </div>
                  {meta.structuredData.types.length > 0 && (
                    <CopyButton text={jsonLdString} iconOnly title="Copy JSON-LD Schema Types" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
