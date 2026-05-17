"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const PERIODS = [
  { value: "day", label: "Tag" },
  { value: "week", label: "Woche" },
  { value: "month", label: "Monat" },
  { value: "year", label: "Jahr" },
];

export default function PeriodFilter({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const set = (p: string) => {
    const params = new URLSearchParams(sp.toString());
    params.set("period", p);
    router.push(`${pathname}?${params.toString()}`);
  };
  return (
    <div className="inline-flex border border-surface-container">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => set(p.value)}
          className={`px-4 py-2 font-headline text-[11px] uppercase tracking-widest font-bold transition-colors ${
            current === p.value
              ? "bg-primary text-on-primary"
              : "bg-white text-on-surface-variant hover:bg-surface-container-low"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
