"use client";

import React from "react";
import { Globe, Search, Loader2, Sparkles, ArrowRight } from "lucide-react";

interface AuditFormProps {
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  isLoading: boolean;
}

const PRESET_URLS = [
  { label: "onmyport.onrender.com", url: "https://onmyport.onrender.com" },
  { label: "portchecker.co", url: "https://portchecker.co" },
  { label: "nextjs.org", url: "https://nextjs.org" },
];

export function AuditForm({
  targetUrl,
  setTargetUrl,
  onSubmit,
  isLoading,
}: AuditFormProps) {
  const handlePresetClick = (presetUrl: string) => {
    setTargetUrl(presetUrl);
  };

  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm relative overflow-hidden transition-all">
      {/* Subtle background glow effect */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 relative z-10">
        <div>
          <h2 className="text-base font-bold tracking-tight flex items-center gap-2 text-foreground font-sans">
            <Globe className="w-5 h-5 text-accent" aria-hidden="true" />
            <span>Target Domain &amp; URL Inspector</span>
          </h2>
          <p className="text-xs text-muted mt-1">
            Audit on-page DOM signals, calculate 1-to-3-word keyword density, and discover referring backlink networks.
          </p>
        </div>

        {/* Quick presets pills */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          <span className="text-muted font-mono flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-accent" aria-hidden="true" />
            Quick Test:
          </span>
          {PRESET_URLS.map((preset) => (
            <button
              key={preset.url}
              type="button"
              disabled={isLoading}
              onClick={() => handlePresetClick(preset.url)}
              className="px-2.5 py-1 rounded-md bg-surface-muted hover:bg-border/60 border border-border text-foreground/80 hover:text-foreground text-[11px] font-mono transition-colors cursor-pointer disabled:opacity-50"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col sm:flex-row gap-3 relative z-10"
      >
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            <Globe className="w-4 h-4 text-accent/80" aria-hidden="true" />
          </div>
          <input
            type="text"
            required
            disabled={isLoading}
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://example.com"
            aria-label="Target domain or URL to audit"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-surface-muted text-sm font-mono text-foreground placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-accent focus:border-transparent transition-all disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !targetUrl.trim()}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground text-sm font-semibold hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer shadow-md shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              <span>Scanning...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" aria-hidden="true" />
              <span>Run Deep Audit</span>
              <ArrowRight className="w-4 h-4 ml-0.5 opacity-80" aria-hidden="true" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
