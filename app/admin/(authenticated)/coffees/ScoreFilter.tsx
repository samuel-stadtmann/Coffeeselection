import Link from "next/link";

export default function ScoreFilter({
  active,
  belowCount,
}: {
  active: boolean;
  belowCount: number;
}) {
  const base =
    "font-headline text-[10px] uppercase tracking-widest font-bold px-3 py-2 transition-colors";
  const on = "bg-primary text-on-primary";
  const off = "bg-stone-100 text-stone-700 hover:bg-stone-200";

  return (
    <div className="flex gap-2 mb-6 items-center">
      <span className="text-xs text-on-surface-variant mr-2 uppercase tracking-widest">Filter:</span>
      <Link href="/admin/coffees" className={base + " " + (!active ? on : off)}>
        Alle anzeigen
      </Link>
      <Link
        href="/admin/coffees?filter=below"
        className={base + " " + (active ? on : off)}
      >
        Nur Score &lt; 75 ({belowCount})
      </Link>
    </div>
  );
}
