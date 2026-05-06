import Link from "next/link";
import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";

const IMG_BEANS =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuC-mgzdszeDV-ADPnt08LksEtq5jHo_pZiXrnzVNy7faF7CAvNwCIqw0tZ2ylgRbHNuI-cdksgJ49bjfH36AYZerX9qRPq7kE2svCJ2KsLCMhI2k4Dc50D2D5FEGms1FJKDbeS75aSghLNY7Dop_dxhV5e-766gOscbYVVzn4qpX1rtPcumcDu7hr6OQeoiBzbRrze7HIkmFAM9YOYzQFzRF1wR3U1Ec53bS5Aj9xRlWvn7KxLIHJL79Wy6T8BFR47-ulGO1PjIJKEL";
const IMG_ROASTER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA-S5G-G2GyXwDSqhZUBVhEPzzhn6fmZjVav9MDmLRnTGguG1RMynNRtrMwDGxCBzjzoSF6OlAEDCOy47VHoi3ZWOP_lDsJTt9l2vjncVB3sPlBZ3_iqCO-t_b8t2mON0PC8klJhq85bKvLFqxRzhU2nTAf0ddAOBci5HMOPNI9RT9Fu8G5Oozu9c8wMB_n5dCv9mHBMPAzqbXs-rjZ3u7WxXvwScbAcg355mQw3rzPzcT7rHe-wZUyVGsAr1SxpcScic3PHn3AlmzX";

const tasteProfile = [
  { label: "Fruchtigkeit", value: 85 },
  { label: "Säure", value: 72 },
  { label: "Körper", value: 40 },
  { label: "Süsse", value: 65 },
  { label: "Röstung", value: 25 },
];

export default function MatchResultPage() {
  return (
    <div className="bg-background text-on-surface min-h-screen selection:bg-secondary/20">
      <Nav />
      <div className="bg-[#f5eee6] h-[1px] w-full mt-16" />

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-20">
        <div className="mb-2">
          <span className="font-sans text-xs uppercase tracking-[0.2em] text-secondary font-semibold">
            Dein Match
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-16 items-start">
          {/* Left: Image & Roaster */}
          <div className="w-full lg:w-3/5 space-y-8">
            <div className="relative group">
              <div className="aspect-[4/5] overflow-hidden rounded-xl bg-surface-container-low">
                <img
                  src={IMG_BEANS}
                  alt="Ethiopia Yirgacheffe coffee beans"
                  className="w-full h-full object-cover grayscale-[0.2] contrast-[1.1] transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              {/* Match Badge */}
              <div className="absolute -bottom-6 -right-6 lg:right-12 glass-card p-8 rounded-full shadow-2xl border border-outline-variant/10 flex flex-col items-center justify-center w-32 h-32">
                <span className="font-serif text-3xl font-bold text-primary">93%</span>
                <span className="font-sans text-[10px] uppercase tracking-widest text-secondary font-bold">Match</span>
              </div>
            </div>

            {/* Roaster Story */}
            <div className="bg-surface-container-lowest p-8 rounded-xl flex items-center gap-6 shadow-[0_4px_24px_rgba(52,23,6,0.02)]">
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 bg-surface-variant">
                <img src={IMG_ROASTER} alt="Roaster Portrait" className="w-full h-full object-cover" />
              </div>
              <div>
                <h4 className="font-serif text-lg text-primary">Miro&apos;s Roastery</h4>
                <p className="font-sans text-xs text-on-surface-variant leading-relaxed">
                  Unser Partner aus Zürich. Handgeröstet in kleinen Chargen für maximale Aromen-Tiefe.
                </p>
              </div>
            </div>
          </div>

          {/* Right: Info & Actions */}
          <div className="w-full lg:w-2/5 sticky top-24">
            <h2 className="text-5xl md:text-6xl font-serif text-primary leading-[1.1] mb-6 tracking-tighter">
              Ethiopia Yirgacheffe
            </h2>
            <p className="font-serif italic text-lg text-on-surface-variant leading-relaxed mb-10">
              &ldquo;Dieses Profil spiegelt Ihre Vorliebe für lebendige, florale Noten wider. Die feine
              Balance aus Jasmin und Limette harmoniert perfekt mit Ihrem Wunsch nach einem hellen,
              klaren Körper.&rdquo;
            </p>

            {/* Taste Profiler */}
            <div className="space-y-6 mb-12">
              <h3 className="font-sans text-[10px] uppercase tracking-[0.3em] text-on-surface-variant font-bold mb-8">
                Geschmacksprofil
              </h3>
              {tasteProfile.map((t) => (
                <div key={t.label} className="space-y-2">
                  <div className="flex justify-between font-sans text-xs uppercase tracking-widest">
                    <span>{t.label}</span>
                    <span className="text-secondary">{t.value}%</span>
                  </div>
                  <div className="h-[2px] bg-outline-variant/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all duration-1000"
                      style={{ width: `${t.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Link
                href="/checkout/shipping"
                className="w-full flex items-center justify-center gap-3 bg-primary text-on-primary px-8 py-5 rounded-lg font-label text-sm uppercase tracking-widest hover:opacity-90 transition-all duration-300 shadow-xl shadow-primary/20"
              >
                <span className="material-symbols-outlined text-sm">shopping_bag</span>
                Jetzt bestellen — CHF 24.90
              </Link>
              <Link
                href="/quiz"
                className="w-full flex items-center justify-center gap-3 border border-outline-variant text-primary px-8 py-5 rounded-lg font-label text-sm uppercase tracking-widest hover:bg-surface-container transition-all duration-300"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Quiz wiederholen
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-3 text-on-surface-variant">
              <span className="material-symbols-outlined text-sm">local_shipping</span>
              <span className="font-sans text-xs">Röstfrisch geliefert in 2–4 Werktagen</span>
            </div>
          </div>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
