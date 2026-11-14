"use client";

import { useState, useEffect } from "react";
import { History, Trash2, RotateCw } from "lucide-react";
import type { FullScanHistoryItem } from "@/types/seo";

const FULL_HISTORY_STORAGE_KEY = "seo_radar_full_history";
const MAX_HISTORY_ITEMS = 10;

/**
 * Extracts a clean readable domain label from a URL.
 */
function extractDomainLabel(urlStr: string): string {
  try {
    const parsed = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return urlStr.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0] || urlStr;
  }
}

/**
 * Records a full audit snapshot in localStorage, bumping the URL to the front.
 */
export function recordFullScanInHistory(
  item: Omit<FullScanHistoryItem, "id">
): void {
  if (typeof window === "undefined") return;

  try {
    const raw = localStorage.getItem(FULL_HISTORY_STORAGE_KEY);
    const existing: FullScanHistoryItem[] = raw ? JSON.parse(raw) : [];

    const domain = extractDomainLabel(item.url);
    const fullItem: FullScanHistoryItem = {
      ...item,
      id: `${domain}-${Date.now()}`,
      domain,
    };

    // Remove older duplicate instances of this domain to bump to top
    const filtered = existing.filter(
      (entry) => entry.domain.toLowerCase() !== domain.toLowerCase()
    );

    const updated = [fullItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(FULL_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("seo-radar-full-history-update"));
  } catch {
    // Ignore quota/access errors
  }
}

/**
 * Returns the latest stored scan snapshot from localStorage, if available.
 */
export function getLatestStoredScan(): FullScanHistoryItem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FULL_HISTORY_STORAGE_KEY);
    if (!raw) return null;
    const parsed: FullScanHistoryItem[] = JSON.parse(raw);
    return parsed.length > 0 ? parsed[0] : null;
  } catch {
    return null;
  }
}

/**
 * Clears the stored full scan history.
 */
export function clearFullScanHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(FULL_HISTORY_STORAGE_KEY);
    window.dispatchEvent(new Event("seo-radar-full-history-update"));
  } catch {
    // Ignore
  }
}

interface RecentScansProps {
  onRestore: (item: FullScanHistoryItem) => void;
  onRescan: (url: string) => void;
  currentUrl?: string;
  disabled?: boolean;
}

export function RecentScans({
  onRestore,
  onRescan,
  currentUrl,
  disabled,
}: RecentScansProps) {
  const [history, setHistory] = useState<FullScanHistoryItem[]>([]);

  useEffect(() => {
    const loadHistory = () => {
      try {
        const raw = localStorage.getItem(FULL_HISTORY_STORAGE_KEY);
        setHistory(raw ? JSON.parse(raw) : []);
      } catch {
        setHistory([]);
      }
    };

    loadHistory();

    const handleUpdate = () => loadHistory();
    window.addEventListener("seo-radar-full-history-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener("seo-radar-full-history-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 px-1">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        <span className="text-[11px] font-mono text-muted flex items-center gap-1 shrink-0">
          <History className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
          History:
        </span>

        <div className="flex items-center gap-2">
          {history.map((item) => {
            const isSelected =
              currentUrl &&
              (currentUrl === item.url || currentUrl.includes(item.domain));

            let scoreColor = "text-danger bg-danger/10 border-danger/30";
            if (item.score >= 80) {
              scoreColor = "text-success bg-success/10 border-success/30";
            } else if (item.score >= 60) {
              scoreColor = "text-warning bg-warning/10 border-warning/30";
            }

            return (
              <div
                key={item.id}
                className={`inline-flex items-center rounded-lg border transition-all shadow-2xs ${
                  isSelected
                    ? "border-accent bg-accent/5 ring-1 ring-accent/30"
                    : "border-border bg-surface hover:border-accent/40"
                }`}
              >
                {/* 1-Click Instant Restore Button */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRestore(item)}
                  title={`Restore full saved audit for ${item.domain} (Score: ${item.score}/100)`}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-foreground/90 hover:text-foreground cursor-pointer disabled:opacity-50"
                >
                  <span className="truncate max-w-[130px] font-medium">{item.domain}</span>
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${scoreColor}`}>
                    {item.score}%
                  </span>
                </button>

                {/* Direct Live Re-Scan Trigger */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRescan(item.url)}
                  title={`Re-scan ${item.domain} live`}
                  className="px-1.5 py-1 text-muted hover:text-accent border-l border-border/70 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className="w-2.5 h-2.5" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={clearFullScanHistory}
        className="inline-flex items-center gap-1 text-[11px] font-mono text-muted hover:text-danger transition-colors cursor-pointer self-start sm:self-auto shrink-0 px-1 py-0.5 rounded hover:bg-danger/5 disabled:opacity-50"
        title="Clear all saved audit history"
      >
        <Trash2 className="w-3 h-3" aria-hidden="true" />
        <span>Clear History</span>
      </button>
    </div>
  );
}
