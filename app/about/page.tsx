import Link from "next/link";
import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#fdf9f4]">
      <Nav />
      <MobileNav />

      {/* Hero */}
      <section className="relative h-[70vh] min-h-[480px] flex items-end">
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSb4m6IGOUeMwA4Yg9ULM6o03fNDEOBwl5QFpTistR845sK9zaWSx38ve29l3nhbEam7NGDdwLdqqZ1rXkSi7xLsfJ4-hQmUkdVf6CrdYBtPIBEREwGTBm0a0UQWDANAA-CpXQJqmW2Scx7j0sP98X_gTaK6MO3z0jiBenMOymOD8FKr2AubntZfPypvUL7FF0nX7rliGh792VC74TpGapin2Cgv-ByVBHBu2HJs6dVpE96gcBmWFm5agCUeGaT6UaBg5woxih6WH2"
          alt="Coffee hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#341706]/80 via-[#341706]/30 to-transparent" />
        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-16 w-full">
          <h1 className="font-serif text-5xl md:text-7xl text-white leading-tight">
            Die Kunst der Kuration
          </h1>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <h2 className="font-serif text-3xl md:text-4xl text-[#341706] mb-8">
          Wir haben das Schweizer Kaffeeritual neu erfunden.
        </h2>
        <p className="font-sans text-[#51443e] text-lg leading-relaxed max-w-3xl">
          Digital Sommelier entstand aus einer einfachen Überzeugung: Jeder Mensch verdient einen Kaffee,
          der wirklich zu ihm passt. Wir haben die Welt der Spitzenkafferöstereien der Schweiz erkundet,
          die besten Handwerker aufgespürt und ein System entwickelt, das Ihre persönlichen
          Geschmacksvorlieben mit den außergewöhnlichsten Kaffees der Region verbindet. Durch unseren
          wissenschaftlich fundierten Geschmackstest, entwickelt in Zusammenarbeit mit professionellen
          Kaffeeverkostern und Sommeliers, erstellen wir ein einzigartiges Profil, das mit jedem
          Abonnement präziser wird. Das Ergebnis: Eine Kaffee-Entdeckungsreise, die Sie Monat für Monat
          neu überrascht und begeistert — kuratiert wie ein guter Wein, serviert mit der Präzision eines
          Schweizer Uhrwerks.
        </p>
      </section>

      {/* Values bento grid */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-white rounded-xl shadow-sm border border-[#d5c3bb]/40">
            <span className="material-symbols-outlined text-[#341706] text-4xl mb-4 block">verified</span>
            <h3 className="font-serif text-2xl text-[#341706] mb-3">Kuration</h3>
            <p className="font-sans text-[#51443e] leading-relaxed">
              Jeder Kaffee in unserem Sortiment wird sorgfältig ausgewählt und blind verkostet.
              Nur das Beste gelangt zu unseren Kunden.
            </p>
          </div>
          <div className="p-8 bg-white rounded-xl shadow-sm border border-[#d5c3bb]/40">
            <span className="material-symbols-outlined text-[#341706] text-4xl mb-4 block">store</span>
            <h3 className="font-serif text-2xl text-[#341706] mb-3">Local Craft</h3>
            <p className="font-sans text-[#51443e] leading-relaxed">
              Wir arbeiten ausschließlich mit unabhängigen Schweizer Röstereien zusammen,
              die ihr Handwerk mit Leidenschaft und Expertise betreiben.
            </p>
          </div>
          <div className="p-8 bg-white rounded-xl shadow-sm border border-[#d5c3bb]/40">
            <span className="material-symbols-outlined text-[#341706] text-4xl mb-4 block">explore</span>
            <h3 className="font-serif text-2xl text-[#341706] mb-3">Discovery</h3>
            <p className="font-sans text-[#51443e] leading-relaxed">
              Entdecken Sie Kaffeewelten, die Sie noch nicht kannten. Unser Algorithmus
              führt Sie systematisch zu neuen Horizonten Ihres Geschmacks.
            </p>
          </div>
        </div>
      </section>

      {/* Founder's note */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="border-l-4 border-[#795900] pl-8">
          <blockquote className="font-serif italic text-xl md:text-2xl text-[#341706] leading-relaxed mb-6">
            &ldquo;Ich habe Digital Sommelier gegründet, weil ich glaubte, dass die Schweiz
            eine der lebendigsten Kaffeekulturen der Welt hat — aber kaum jemand weiss davon.
            Unser Ziel ist es, diese Schätze zu den Menschen zu bringen, die sie wirklich
            zu schätzen wissen.&rdquo;
          </blockquote>
          <p className="font-sans text-[#51443e] font-semibold">
            — Samuel Stadtmann, Gründer
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#341706] py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-6">
            Bereit für Ihren Match?
          </h2>
          <p className="font-sans text-white/80 text-lg mb-10">
            Finden Sie in nur 3 Minuten den Kaffee, der wirklich zu Ihnen passt.
          </p>
          <Link
            href="/quiz"
            className="inline-block bg-white text-[#341706] font-sans font-semibold px-10 py-4 rounded-full text-lg hover:bg-[#fdf9f4] transition-colors"
          >
            Jetzt Quiz starten
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
