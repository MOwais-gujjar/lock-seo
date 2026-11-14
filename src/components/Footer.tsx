import React from "react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs font-mono text-muted">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Lock SEO</span>
          <span>•</span>
          <span>Localhost Intelligence Engine</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span>100% Local Execution</span>
          <span>•</span>
          <span>Zero External Tracking</span>
        </div>
      </div>
    </footer>
  );
}
