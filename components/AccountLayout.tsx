import Link from "next/link";
import AccountSidebar from "@/components/AccountSidebar";

const LOGO = "/logo.png";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20 md:pb-0">
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-72 md:h-96 w-auto object-contain -my-16 md:-my-24 mr-8 shrink-0" src={LOGO} />
          </Link>
          <Link
            href="/quiz/question-1-brewing-method"
            className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
          >
            Quiz wiederholen
          </Link>
        </nav>
      </header>
      <main className="pt-44 md:pt-56 pb-20">
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
