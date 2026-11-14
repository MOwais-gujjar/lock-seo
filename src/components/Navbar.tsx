"use client";

import { useSyncExternalStore } from "react";
import { Lock, Sun, Moon, Activity } from "lucide-react";

function subscribeToTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme"],
  });
  window.addEventListener("storage", callback);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", callback);
  };
}

function getThemeSnapshot(): boolean {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot(): boolean {
  return true;
}

export function Navbar() {
  const isDark = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerSnapshot
  );

  const toggleTheme = () => {
    const nextDark = !isDark;

    if (nextDark) {
      document.documentElement.classList.add("dark");
      document.documentElement.dataset.theme = "dark";
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.dataset.theme = "light";
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/40 flex items-center justify-center text-accent shadow-xs shadow-accent/10">
            <Lock className="w-5 h-5 text-accent" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold tracking-tight text-lg font-sans text-foreground">
                LOCK <span className="text-accent">SEO</span>
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/30 text-success text-[11px] font-mono font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                <span>LOCAL ENGINE</span>
              </div>
            </div>
            <p className="text-xs text-muted hidden sm:block">
              Technical On-Page Auditing &amp; Competitor Backlink Intelligence
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-muted border border-border text-xs text-muted font-mono">
            <Activity className="w-3.5 h-3.5 text-accent" aria-hidden="true" />
            <span>NODE_ENGINE: ACTIVE</span>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-muted text-xs font-mono font-medium transition-all cursor-pointer shadow-2xs hover:border-accent/40"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-warning" aria-hidden="true" />
                <span className="hidden sm:inline">LIGHT</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-accent" aria-hidden="true" />
                <span className="hidden sm:inline">DARK</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
