"use client";

import React, { useState } from "react";
import { Link2, ExternalLink, Globe, Filter, ShieldCheck, CheckCircle, AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import type { BacklinkAnalysisResult, BacklinkItem } from "@/types/seo";

interface BacklinkDeckProps {
  backlinks: BacklinkAnalysisResult | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const CATEGORIES: Array<BacklinkItem["platformCategory"] | "All"> = [
  "All",
  "Community/Forum",
  "Code/Docs",
  "Directory",
  "Blog/Web",
];

export function BacklinkDeck({
  backlinks,
  isLoading,
  error,
  onRetry,
}: BacklinkDeckProps) {
  const [selectedCategory, setSelectedCategory] = useState<BacklinkItem["platformCategory"] | "All">("All");

  if (!backlinks && !isLoading && !error) {
    return null;
  }

  const allItems = backlinks?.backlinks ?? [];
  const filteredItems = selectedCategory === "All"
    ? allItems
    : allItems.filter((item) => item.platformCategory === selectedCategory);

  const allBacklinksUrls = filteredItems.map((item) => item.sourceUrl).join("\n");

  return (
    <section aria-label="Discovered Backlink Profile" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
            <Link2 className="w-4 h-4 text-accent" aria-hidden="true" />
            <span>Discovered Backlinks &amp; Referring Mentions</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Query operator: <code className="text-accent/90 bg-surface-muted px-1.5 py-0.5 rounded border border-border text-[11px]">{backlinks?.queryUsed || `"-site:target"`}</code>
          </p>
        </div>

        {/* Action Controls & Category Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {filteredItems.length > 0 && (
            <CopyButton
              text={allBacklinksUrls}
              label="Copy All Backlinks"
              className="px-3 py-1.5 rounded-lg border bg-surface text-xs font-medium shadow-xs"
            />
          )}

          <div className="flex items-center flex-wrap gap-1.5 p-1 rounded-xl bg-surface border border-border">
            <span className="text-[11px] font-mono text-muted px-2 hidden sm:inline flex items-center gap-1">
              <Filter className="w-3 h-3 text-accent" aria-hidden="true" />
              Filter:
            </span>
            {CATEGORIES.map((cat) => {
              const count = cat === "All"
                ? allItems.length
                : allItems.filter((i) => i.platformCategory === cat).length;

              return (
                <button
                  key={cat}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer disabled:opacity-50 ${
                    selectedCategory === cat
                      ? "bg-accent text-accent-foreground font-semibold shadow-xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Non-blocking Backlink Error / Warning Banner */}
      {error && (
        <div className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-xs font-mono text-warning flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <strong className="font-semibold block font-sans text-foreground">
                Live Backlink Crawler Notice
              </strong>
              <p className="text-[11px] text-foreground/80 mt-0.5">
                {error} - Displaying structured footprint references below.
              </p>
            </div>
          </div>
          {onRetry && (
            <button
              type="button"
              disabled={isLoading}
              onClick={onRetry}
              className="px-2.5 py-1 rounded-lg bg-warning/20 hover:bg-warning/30 text-xs font-mono font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 text-foreground disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>Retry Search</span>
            </button>
          )}
        </div>
      )}

      {/* Backlink Table Card */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="p-4 bg-surface-muted/50 border-b border-border flex items-center justify-between text-xs font-mono text-muted">
          <span>{filteredItems.length} Referring Source(s) Listed</span>
          <span className="flex items-center gap-1 text-success">
            <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
            Verified Citations
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs font-mono text-muted space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" aria-hidden="true" />
            <p>Querying Common Crawl indexes and search operators...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-muted space-y-2">
            <Globe className="w-8 h-8 text-muted/40 mx-auto" aria-hidden="true" />
            <p>No referring backlinks found matching the selected filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-muted text-[11px] uppercase">
                  <th scope="col" className="py-3 px-4 font-semibold">Source Domain &amp; Page Title</th>
                  <th scope="col" className="py-3 px-4 font-semibold">Snippet / Anchor Hint</th>
                  <th scope="col" className="py-3 px-4 font-semibold text-center w-36">Category</th>
                  <th scope="col" className="py-3 px-4 font-semibold text-right w-32">Link Equity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredItems.map((item, index) => (
                  <tr
                    key={`${item.sourceUrl}-${index}`}
                    className="hover:bg-surface-muted/60 transition-colors group"
                  >
                    {/* Domain & Title */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-sm">
                      <div className="flex items-start gap-2">
                        <Globe className="w-3.5 h-3.5 text-accent mt-0.5 shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <a
                              href={item.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-semibold text-foreground hover:text-accent flex items-center gap-1 group/link transition-colors truncate"
                            >
                              <span className="truncate">{item.title}</span>
                              <ExternalLink className="w-3 h-3 opacity-60 group-hover/link:opacity-100 shrink-0" aria-hidden="true" />
                            </a>
                            <CopyButton
                              text={item.sourceUrl}
                              iconOnly
                              title={`Copy URL ${item.sourceUrl}`}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                          </div>
                          <span className="text-[11px] text-muted block truncate mt-0.5">
                            {item.sourceDomain}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Snippet / Anchor Hint */}
                    <td className="py-3 px-4 max-w-sm lg:max-w-md">
                      <p className="text-muted text-[11px] leading-relaxed line-clamp-2">
                        {item.snippet}
                      </p>
                      {item.anchorHint && (
                        <span className="text-[10px] text-foreground/70 font-semibold mt-1 inline-block">
                          Anchor: <span className="text-accent/90">&quot;{item.anchorHint.slice(0, 50)}...&quot;</span>
                        </span>
                      )}
                    </td>

                    {/* Platform Category Badge */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-md text-[11px] bg-surface-muted border border-border text-foreground font-medium">
                        {item.platformCategory}
                      </span>
                    </td>

                    {/* Link Type Badge */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                          item.linkType === "DoFollow"
                            ? "bg-success/10 text-success border-success/30"
                            : item.linkType === "NoFollow"
                            ? "bg-surface-muted text-muted border-border"
                            : "bg-accent/10 text-accent border-accent/30"
                        }`}
                      >
                        {item.linkType === "DoFollow" && (
                          <ShieldCheck className="w-3 h-3" aria-hidden="true" />
                        )}
                        {item.linkType}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
