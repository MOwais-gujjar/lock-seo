"use client";

import React, { useState } from "react";
import { BarChart3, Hash, Percent, Layers } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import type { KeywordAnalysisResult, KeywordMetric } from "@/types/seo";

interface KeywordTableProps {
  keywords: KeywordAnalysisResult;
}

export function KeywordTable({ keywords }: KeywordTableProps) {
  const [activeTab, setActiveTab] = useState<"1-gram" | "2-gram" | "3-gram">("1-gram");

  let currentList: KeywordMetric[] = keywords.oneGrams;
  let tabTitle = "Single Keywords (Top 15)";
  if (activeTab === "2-gram") {
    currentList = keywords.twoGrams;
    tabTitle = "Two-Word Phrases / Bigrams (Top 10)";
  } else if (activeTab === "3-gram") {
    currentList = keywords.threeGrams;
    tabTitle = "Three-Word Phrases / Trigrams (Top 10)";
  }

  const maxDensity = Math.max(...currentList.map((k) => k.density), 1);

  // Build formatted text for copying all keywords in the current tab (ranked with metrics)
  const allKeywordsText = currentList
    .map((k, i) => `${i + 1}. ${k.term} (${k.count}x, ${k.density.toFixed(2)}%)`)
    .join("\n");

  // Build clean comma-separated keywords string for SEO/PPC pasting
  const csvKeywordsText = currentList.map((k) => k.term).join(", ");

  return (
    <section aria-label="Keyword Density & N-Gram Distribution" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-mono font-semibold uppercase tracking-wider text-muted flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" aria-hidden="true" />
            <span>Keyword Frequency &amp; Density Analysis</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Parsed {keywords.totalWordCount.toLocaleString()} words ({keywords.uniqueWordCount.toLocaleString()} unique tokens)
          </p>
        </div>

        {/* Tab switchers & Copy Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <CopyButton
            text={allKeywordsText}
            label="Copy Ranked"
            title="Copy ranked keyword phrases with counts and densities"
            className="px-2.5 py-1.5 rounded-lg border bg-surface text-xs font-medium shadow-xs"
          />

          <CopyButton
            text={csvKeywordsText}
            label="Copy CSV"
            title="Copy comma-separated keywords list (ideal for Google Ads & SEO spreadsheets)"
            className="px-2.5 py-1.5 rounded-lg border bg-surface text-xs font-medium shadow-xs"
          />

          <div className="inline-flex p-1 rounded-xl bg-surface border border-border">
            <button
              type="button"
              onClick={() => setActiveTab("1-gram")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                activeTab === "1-gram"
                  ? "bg-accent text-accent-foreground shadow-xs font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              1-Word ({keywords.oneGrams.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("2-gram")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                activeTab === "2-gram"
                  ? "bg-accent text-accent-foreground shadow-xs font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              2-Word ({keywords.twoGrams.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("3-gram")}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                activeTab === "3-gram"
                  ? "bg-accent text-accent-foreground shadow-xs font-semibold"
                  : "text-muted hover:text-foreground"
              }`}
            >
              3-Word ({keywords.threeGrams.length})
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-hidden shadow-xs">
        <div className="p-4 bg-surface-muted/50 border-b border-border flex items-center justify-between text-xs font-mono text-muted">
          <span>{tabTitle}</span>
          <span>Placement Zone Relevance</span>
        </div>

        {currentList.length === 0 ? (
          <div className="p-12 text-center text-xs font-mono text-muted">
            No keywords found for this n-gram category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-muted text-[11px] uppercase">
                  <th scope="col" className="py-3 px-4 font-semibold">Term / Phrase</th>
                  <th scope="col" className="py-3 px-4 font-semibold text-center w-24">
                    <span className="flex items-center justify-center gap-1">
                      <Hash className="w-3 h-3" aria-hidden="true" />
                      Count
                    </span>
                  </th>
                  <th scope="col" className="py-3 px-4 font-semibold w-48">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3 h-3" aria-hidden="true" />
                      Density
                    </span>
                  </th>
                  <th scope="col" className="py-3 px-4 font-semibold text-right w-44">
                    <span className="flex items-center justify-end gap-1">
                      <Layers className="w-3 h-3" aria-hidden="true" />
                      SEO Placement
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {currentList.map((item, index) => {
                  const percentageWidth = Math.min(100, (item.density / maxDensity) * 100);

                  return (
                    <tr
                      key={`${item.term}-${index}`}
                      className="hover:bg-surface-muted/60 transition-colors group"
                    >
                      {/* Term name + Copy Button */}
                      <td className="py-3 px-4 font-medium text-foreground">
                        <div className="flex items-center gap-2">
                          <span className="text-accent font-bold text-[11px]">#{index + 1}</span>
                          <span className="text-foreground">{item.term}</span>
                          <CopyButton
                            text={item.term}
                            iconOnly
                            title={`Copy keyword "${item.term}"`}
                            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                      </td>

                      {/* Frequency Count */}
                      <td className="py-3 px-4 text-center font-bold text-foreground">
                        {item.count}
                      </td>

                      {/* Density with visual bar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-12 text-foreground font-bold">{item.density.toFixed(2)}%</span>
                          <div className="flex-1 h-2 rounded-full bg-surface-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-accent/80 transition-all duration-500"
                              style={{ width: `${percentageWidth}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Placement Badges */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span
                            title={item.inTitle ? "Present in <title>" : "Missing in <title>"}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              item.inTitle
                                ? "bg-accent/15 text-accent border-accent/40"
                                : "bg-surface-muted text-muted/40 border-border/40"
                            }`}
                          >
                            TITLE
                          </span>
                          <span
                            title={item.inH1 ? "Present in <h1>" : "Missing in <h1>"}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              item.inH1
                                ? "bg-success/15 text-success border-success/40"
                                : "bg-surface-muted text-muted/40 border-border/40"
                            }`}
                          >
                            H1
                          </span>
                          <span
                            title={
                              item.inMetaDescription
                                ? "Present in <meta description>"
                                : "Missing in <meta description>"
                            }
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                              item.inMetaDescription
                                ? "bg-warning/15 text-warning border-warning/40"
                                : "bg-surface-muted text-muted/40 border-border/40"
                            }`}
                          >
                            META
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
