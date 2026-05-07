import Link from "next/link";
import AccountSidebar from "@/components/AccountSidebar";

const LOGO = "/logo.png";

export default function AccountStub({ title, icon, description }: { title: string; icon: string; description: string }) {
  return (
    <div className="bg-[#F9F5F0] text-on-surface min-h-screen pb-20 md:pb-0">
      <header className="fixed top-0 w-full z-50 bg-[#F9F5F0]/95 backdrop-blur-md border-b border-primary/5">
        <nav className="flex justify-between items-center max-w-7xl mx-auto px-6 md:px-8 w-full">
          <Link href="/" className="flex items-center">
            <img alt="Coffee Selection" className="h-40 md:h-52 w-auto object-contain -my-6 md:-my-10 mr-8" src={LOGO} />
          </Link>
          <Link
            href="/quiz/question-1-brewing-method"
            className="bg-primary text-white px-5 md:px-6 py-3 text-[11px] md:text-[12px] uppercase tracking-[0.2em] font-headline font-bold hover:bg-black transition-all"
          >
            Quiz wiederholen
          </Link>
        </nav>
      </header>

      <main className="pt-28 md:pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            <div className="lg:col-span-3">
              <AccountSidebar />
            </div>
            <div className="lg:col-span-9">
              <div className="bg-white p-12 md:p-20 shadow-sm text-center">
                <span className="material-symbols-outlined text-tertiary text-5xl mb-6 block">{icon}</span>
                <h1 className="text-3xl md:text-4xl text-primary mb-4 font-headline font-bold uppercase tracking-tight">{title}</h1>
                <p className="text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">{description}</p>
                <span className="inline-block px-4 py-2 bg-tertiary/10 font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
                  In Entwicklung — bald verfügbar
                </span>
                <div className="mt-8">
                  <Link
                    href="/account/dashboard"
                    className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1"
                  >
                    ← Zurück zum Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
