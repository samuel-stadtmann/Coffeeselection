import Link from "next/link";
import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";

const IMG_HERO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAeplTqm8LOFUBL-biHtOoBz4zl4p38usWJavjaeSrNa747j_d2VAJhJORAEpvxDKUFDmnEwx73UTs1RlAFY_PIjJm5wCZqJhjH1fqO7lgNELbNjii7Um9dSZ-kI80-7NS8pmx5DADV3uFgmm7KDbsvIot43_8cTndqJocPI2jAeS-6n25BAoXo5JXSi1ljj6O6-I7MThAR4us0j-WgzhHAcS9r8HFg_arWrzVDuFxsMzybbDqjEuHVNKIhEsIjEApY2BplqNzn8GTk";

export default function HomePage() {
  return (
    <div className="bg-background text-on-surface selection:bg-secondary/20">
      <Nav />

      <main className="pt-16">
        {/* Hero */}
        <section className="relative min-h-[795px] flex flex-col items-center justify-center px-6 text-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img
              src={IMG_HERO}
              alt="Minimalist coffee ritual"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
          </div>
          <div className="relative z-10 max-w-4xl mx-auto space-y-8">
            <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary font-semibold">
              Premium Swiss Roast
            </span>
            <h1 className="text-5xl md:text-7xl text-primary tracking-tighter leading-tight font-headline">
              Finde deinen perfekten <br className="hidden md:block" /> Specialty Coffee
            </h1>
            <p className="max-w-xl mx-auto text-on-surface-variant font-light text-lg leading-relaxed">
              Entdecke die Kunst des Kaffees durch eine kuratierte Auswahl der besten Schweizer
              Röstereien, maßgeschneidert für deinen Gaumen.
            </p>
            <div className="pt-6">
              <Link
                href="/quiz"
                className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-10 py-4 rounded-lg font-label text-sm uppercase tracking-widest hover:opacity-90 transition-all duration-300 shadow-xl shadow-primary/10"
              >
                Start Quiz
              </Link>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-24 bg-surface-container-low">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
              <div className="flex flex-col gap-2">
                <span className="text-3xl font-headline text-primary">2,000+ Coffee Lovers</span>
                <p className="text-on-surface-variant font-light tracking-wide uppercase text-xs">
                  Vertrauen auf unsere Expertise
                </p>
              </div>
              <div className="flex items-center gap-12 opacity-70">
                {[
                  { icon: "verified_user", label: "Swiss Made" },
                  { icon: "eco", label: "Sustainable" },
                  { icon: "local_shipping", label: "Fresh Roast" },
                ].map((b) => (
                  <div key={b.label} className="flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-3xl font-light">{b.icon}</span>
                    <span className="text-[10px] uppercase tracking-widest font-semibold">{b.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-32 bg-background">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="text-center mb-24">
              <h2 className="text-4xl text-primary mb-4 font-headline">Dein Weg zum Genuss</h2>
              <div className="h-px w-12 bg-secondary/30 mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8">
              {[
                {
                  n: "01",
                  title: "Geschmacksprofil",
                  desc: "Beantworte kurze Fragen zu deinen Vorlieben – von fruchtig-leicht bis schokoladig-intensiv.",
                },
                {
                  n: "02",
                  title: "Matching",
                  desc: "Unser Algorithmus findet die perfekte Bohne aus über 50 exklusiven Schweizer Röstungen.",
                },
                {
                  n: "03",
                  title: "Direktversand",
                  desc: "Erhalte deinen Kaffee röstfrisch direkt von der Manufaktur in deinen Briefkasten.",
                },
              ].map((step) => (
                <div key={step.n} className="group flex flex-col items-center text-center space-y-6">
                  <span className="text-secondary/20 font-headline text-7xl md:text-8xl leading-none group-hover:text-secondary/40 transition-colors duration-500">
                    {step.n}
                  </span>
                  <h3 className="text-2xl text-primary font-headline">{step.title}</h3>
                  <p className="text-on-surface-variant font-light leading-relaxed px-4">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Roasters */}
        <section className="py-32 bg-surface-container-low">
          <div className="max-w-screen-xl mx-auto px-6">
            <div className="flex justify-between items-end mb-16">
              <div>
                <span className="font-label text-xs uppercase tracking-[0.2em] text-secondary font-semibold block mb-3">
                  Kuratierte Partner
                </span>
                <h2 className="text-3xl text-primary font-headline">Unsere Röstereien</h2>
              </div>
              <Link
                href="/brewing-guides"
                className="font-label text-xs uppercase tracking-[0.1em] text-on-surface-variant hover:text-secondary transition-colors hidden md:block"
              >
                Alle anzeigen →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "Miro's Roastery",
                  location: "Zürich",
                  specialty: "Helle Röstungen · Ethiopian origins",
                  img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-S5G-G2GyXwDSqhZUBVhEPzzhn6fmZjVav9MDmLRnTGguG1RMynNRtrMwDGxCBzjzoSF6OlAEDCOy47VHoi3ZWOP_lDsJTt9l2vjncVB3sPlBZ3_iqCO-t_b8t2mON0PC8klJhq85bKvLFqxRzhU2nTAf0ddAOBci5HMOPNI9RT9Fu8G5Oozu9c8wMB_n5dCv9mHBMPAzqbXs-rjZ3u7WxXvwScbAcg355mQw3rzPzcT7rHe-wZUyVGsAr1SxpcScic3PHn3AlmzX",
                },
                {
                  name: "Alpine Coffee Lab",
                  location: "Bern",
                  specialty: "Natural processing · Swiss direct trade",
                  img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSb4m6IGOUeMwA4Yg9ULM6o03fNDEOBwl5QFpTistR845sK9zaWSx38ve29l3nhbEam7NGDdwLdqqZ1rXkSi7xLsfJ4-hQmUkdVf6CrdYBtPIBEREwGTBm0a0UQWDANAA-CpXQJqmW2Scx7j0sP98X_gTaK6MO3z0jiBenMOymOD8FKr2AubntZfPypvUL7FF0nX7rliGh792VC74TpGapin2Cgv-ByVBHBu2HJs6dVpE96gcBmWFm5agCUeGaT6UaBg5woxih6WH2",
                },
                {
                  name: "Atelier Espresso",
                  location: "Basel",
                  specialty: "Espresso blends · South American beans",
                  img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL",
                },
              ].map((r) => (
                <div key={r.name} className="group overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={r.img}
                      alt={r.name}
                      className="w-full h-full object-cover grayscale-[0.2] group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>
                  <div className="p-6 space-y-2">
                    <h3 className="font-headline text-lg text-primary">{r.name}</h3>
                    <p className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">
                      {r.location}
                    </p>
                    <p className="text-sm text-on-surface-variant font-light">{r.specialty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-32 bg-primary text-on-primary">
          <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
            <h2 className="text-4xl md:text-5xl font-headline leading-tight">
              Bereit für deinen perfekten Kaffee?
            </h2>
            <p className="text-on-primary/70 text-lg font-light leading-relaxed">
              Starte jetzt das Quiz und erhalte deine persönliche Röstungs-Empfehlung in 2 Minuten.
            </p>
            <Link
              href="/quiz"
              className="inline-block bg-secondary-container text-on-background px-10 py-4 rounded-lg font-label text-sm uppercase tracking-widest hover:opacity-90 transition-all duration-300"
            >
              Quiz starten
            </Link>
          </div>
        </section>

        <Footer />
      </main>

      <MobileNav />
    </div>
  );
}
