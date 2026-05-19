"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

export type CustomerRow = {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  created_at: string;
  taste_type_id: number | null;
  taste_type_name: string | null;
  marketing_opt_in: boolean;
  has_abo: boolean;
  order_count: number;
  revenue_chf: number;
  margin_chf: number;
  clv_chf: number;
  last_order_at: string | null;
};

type SortKey =
  | "full_name"
  | "email"
  | "created_at"
  | "order_count"
  | "revenue_chf"
  | "margin_chf"
  | "clv_chf"
  | "last_order_at";

function fmtChf(n: number): string {
  return n.toLocaleString("de-CH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function CustomersTable({ rows }: { rows: CustomerRow[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "buyers" | "abo" | "newsletter">("all");
  const [sortKey, setSortKey] = useState<SortKey>("revenue_chf");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (filter === "buyers" && r.order_count === 0) return false;
        if (filter === "abo" && !r.has_abo) return false;
        if (filter === "newsletter" && !r.marketing_opt_in) return false;
        if (qLower) {
          const hay = `${r.full_name} ${r.email}`.toLowerCase();
          if (!hay.includes(qLower)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        if (typeof av === "number" && typeof bv === "number") {
          return sortDir === "asc" ? av - bv : bv - av;
        }
        const aS = String(av);
        const bS = String(bv);
        return sortDir === "asc" ? aS.localeCompare(bS) : bS.localeCompare(aS);
      });
  }, [rows, q, filter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const ArrowFor = (key: SortKey) =>
    sortKey === key ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  return (
    <div className="bg-white p-6 md:p-8 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Suche nach Name oder Email"
          className="flex-1 min-w-[200px] bg-surface-container-low border border-surface-container px-4 py-2 text-sm focus:outline-none focus:border-tertiary"
        />
        <div className="flex gap-1">
          {([
            ["all", "Alle"],
            ["buyers", "Mit Bestellung"],
            ["abo", "Mit Abo"],
            ["newsletter", "Newsletter"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-2 font-headline text-[10px] uppercase tracking-widest font-bold transition-colors ${
                filter === key
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="ml-auto font-headline text-[11px] uppercase tracking-widest text-on-surface-variant font-bold">
          {filtered.length} {filtered.length === 1 ? "Kunde" : "Kunden"}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-on-surface-variant py-4">Keine Kunden gefunden.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant font-bold border-b border-surface-container">
              <tr>
                <Th onClick={() => toggleSort("full_name")} label={`Kunde${ArrowFor("full_name")}`} />
                <Th onClick={() => toggleSort("email")} label={`Email${ArrowFor("email")}`} />
                <Th onClick={() => toggleSort("created_at")} label={`Seit${ArrowFor("created_at")}`} />
                <th className="py-3 px-2 text-left">Typ</th>
                <th className="py-3 px-2 text-center">Abo / NL</th>
                <Th onClick={() => toggleSort("order_count")} label={`Orders${ArrowFor("order_count")}`} align="right" />
                <Th onClick={() => toggleSort("revenue_chf")} label={`Umsatz${ArrowFor("revenue_chf")}`} align="right" />
                <Th onClick={() => toggleSort("margin_chf")} label={`Marge${ArrowFor("margin_chf")}`} align="right" />
                <Th onClick={() => toggleSort("clv_chf")} label={`CLV${ArrowFor("clv_chf")}`} align="right" />
                <Th onClick={() => toggleSort("last_order_at")} label={`Letzte${ArrowFor("last_order_at")}`} />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container-low/50">
                  <td className="py-2 px-2">
                    <Link
                      href={`/admin/customers/${r.id}`}
                      className="font-headline font-bold text-primary uppercase tracking-tight text-xs hover:text-tertiary transition-colors"
                    >
                      {r.full_name}
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-on-surface-variant text-xs">{r.email}</td>
                  <td className="py-2 px-2 text-on-surface-variant text-xs">{r.created_at}</td>
                  <td className="py-2 px-2 text-xs">{r.taste_type_name ?? "—"}</td>
                  <td className="py-2 px-2 text-center">
                    <span className="inline-flex gap-1">
                      {r.has_abo && (
                        <span title="Aktives Abo" className="bg-tertiary/15 text-tertiary text-[9px] px-1.5 py-0.5 font-headline uppercase tracking-widest font-bold">
                          Abo
                        </span>
                      )}
                      {r.marketing_opt_in && (
                        <span title="Newsletter Opt-In" className="bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 font-headline uppercase tracking-widest font-bold">
                          NL
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right">{r.order_count}</td>
                  <td className="py-2 px-2 text-right font-headline font-bold text-primary">
                    {fmtChf(r.revenue_chf)}
                  </td>
                  <td className="py-2 px-2 text-right text-tertiary">
                    {fmtChf(r.margin_chf)}
                  </td>
                  <td className="py-2 px-2 text-right">{fmtChf(r.clv_chf)}</td>
                  <td className="py-2 px-2 text-on-surface-variant text-xs">
                    {r.last_order_at ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Th({
  onClick,
  label,
  align = "left",
}: {
  onClick: () => void;
  label: string;
  align?: "left" | "right";
}) {
  return (
    <th className={`py-3 px-2 ${align === "right" ? "text-right" : "text-left"}`}>
      <button
        type="button"
        onClick={onClick}
        className="hover:text-primary transition-colors"
      >
        {label}
      </button>
    </th>
  );
}
