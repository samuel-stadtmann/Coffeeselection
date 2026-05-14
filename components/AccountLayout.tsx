import Link from "next/link";
import AccountSidebar from "@/components/AccountSidebar";

const LOGO = "/logo.png";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20 md:pb-0">
      {/* Einheitlicher Header: feste Hoehe h-20 md:h-24. overflow-hidden
          NUR am Logo-Link — nicht am Header (sonst horizontales Clipping). */}
      <header className="fixed top-0 w-full z-50 h-20 md:h-24 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center gap-3 h-full max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center shrink-0 h-full overflow-hidden">
            <img alt="Coffee Selection" className="h-12 sm:h-16 md:h-28 lg:h-40 w-auto object-contain object-left shrink-0" src={LOGO} />
          </Link>
          <Link
            href="/quiz/question-1-brewing-method"
            className="bg-primary text-white px-3 sm:px-5 md:px-6 py-2.5 md:py-3 text-[10px] md:text-[12px] uppercase tracking-[0.15em] md:tracking-[0.2em] font-headline font-bold hover:bg-black transition-all whitespace-nowrap shrink-0"
          >
            Quiz wiederholen
          </Link>
        </nav>
      </header>
      <main className="pt-20 md:pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-3">
              <AccountSidebar />
            </div>
            <div className="lg:col-span-9 space-y-6 md:space-y-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}

export function PageHeader({ subtitle, title, description }: { subtitle: string; title: string; description?: string }) {
  return (
    <div>
      <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-3 block">{subtitle}</span>
      <h1 className="text-3xl md:text-5xl text-primary font-headline font-bold uppercase tracking-tight">{title}</h1>
      {description && <p className="text-on-surface-variant mt-3 max-w-2xl">{description}</p>}
    </div>
  );
}
