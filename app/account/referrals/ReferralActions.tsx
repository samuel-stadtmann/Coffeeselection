"use client";
import { useState } from "react";

export default function ReferralActions({
  code,
  url,
}: {
  code: string;
  url: string;
}) {
  const [copied, setCopied] = useState<"code" | "url" | null>(null);
  const copy = (value: string, kind: "code" | "url") => {
    if (typeof navigator !== "undefined") navigator.clipboard?.writeText(value);
    setCopied(kind);
    setTimeout(() => setCopied(null), 2000);
  };
  return (
    <div className="space-y-3">
      <button
        onClick={() => copy(code, "code")}
        className="w-full bg-tertiary text-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-white transition-all"
      >
        {copied === "code" ? "Kopiert ✓" : "Code kopieren"}
      </button>
      <button
        onClick={() => copy(url, "url")}
        className="w-full border border-on-primary/30 text-on-primary py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-on-primary/10 transition-all"
      >
        {copied === "url" ? "Kopiert ✓" : "Link kopieren"}
      </button>
    </div>
  );
}
