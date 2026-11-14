"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  text: string;
  label?: string;
  title?: string;
  className?: string;
  iconOnly?: boolean;
}

export function CopyButton({
  text,
  label = "Copy",
  title = "Copy to clipboard",
  className = "",
  iconOnly = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!text) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older contexts
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore copy errors
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={title}
      className={`inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer font-mono text-xs select-none ${
        copied
          ? "text-success bg-success/15 border-success/40"
          : "text-muted hover:text-foreground hover:bg-surface-muted border-border"
      } ${className}`}
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-success shrink-0" aria-hidden="true" />
          {!iconOnly && <span className="text-success font-semibold">Copied!</span>}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" aria-hidden="true" />
          {!iconOnly && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
