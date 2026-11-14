"use client";

import React, { useState } from "react";
import { Download, FileJson, FileSpreadsheet, Check } from "lucide-react";
import { exportAsCSV, exportAsJSON } from "@/lib/export-report";
import type { BacklinkAnalysisResult, SEOAuditResult } from "@/types/seo";

interface ExportBarProps {
  seoData: SEOAuditResult;
  backlinkData: BacklinkAnalysisResult | null;
}

export function ExportBar({ seoData, backlinkData }: ExportBarProps) {
  const [downloadingJson, setDownloadingJson] = useState(false);
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  const handleExportJson = () => {
    setDownloadingJson(true);
    try {
      exportAsJSON(seoData, backlinkData);
    } finally {
      setTimeout(() => setDownloadingJson(false), 1500);
    }
  };

  const handleExportCsv = () => {
    setDownloadingCsv(true);
    try {
      exportAsCSV(seoData, backlinkData);
    } finally {
      setTimeout(() => setDownloadingCsv(false), 1500);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Export JSON Button */}
      <button
        type="button"
        onClick={handleExportJson}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-muted text-xs font-mono font-medium text-foreground transition-all cursor-pointer shadow-xs hover:border-accent/40 active:scale-[0.98]"
        title="Download complete audit payload as JSON"
      >
        {downloadingJson ? (
          <>
            <Check className="w-3.5 h-3.5 text-success" aria-hidden="true" />
            <span className="text-success font-semibold">Saved JSON</span>
          </>
        ) : (
          <>
            <FileJson className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            <span>Export JSON</span>
          </>
        )}
      </button>

      {/* Export CSV Button */}
      <button
        type="button"
        onClick={handleExportCsv}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-muted text-xs font-mono font-medium text-foreground transition-all cursor-pointer shadow-xs hover:border-success/40 active:scale-[0.98]"
        title="Download multi-section spreadsheet report as CSV"
      >
        {downloadingCsv ? (
          <>
            <Check className="w-3.5 h-3.5 text-success" aria-hidden="true" />
            <span className="text-success font-semibold">Saved CSV</span>
          </>
        ) : (
          <>
            <FileSpreadsheet className="w-3.5 h-3.5 text-success" aria-hidden="true" />
            <span>Export CSV</span>
            <Download className="w-3 h-3 text-muted ml-0.5" aria-hidden="true" />
          </>
        )}
      </button>
    </div>
  );
}
