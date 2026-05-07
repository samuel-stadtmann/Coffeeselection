import Link from "next/link";
import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";

const HERO_IMG =
  "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=1600&q=80";

const categories = [
  {
    title: "V60 / Pour Over",
    subtitle: "Präzision trifft Geduld",
    img: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
  },
  {
    title: "Espresso",
    subtitle: "Die Essenz des Kaffees",
    img: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=600&q=80",
  },
  {
    title: "French Press",
    subtitle: "Vollmundig &amp; intensiv",
    img: "https://images.unsplash.com/photo-1459755486867-b55449bb39ff?w=600&q=80",
  },
];

const brewingPoints = [
  {
    num: "01",
    title: "Extraktion ist alles",
    body: "Die Extraktion bestimmt, welche Aromen aus dem Kaffeemehl gelöst werden. Zu wenig ergibt Säure, zu viel ergibt Bitterkeit — die goldene Mitte macht den perfekten Kaffee.",
  },
  {
    num: "02",
    title: "Wasser ist der entscheidende Faktor",
    body: "Kaffee besteht zu 98 % aus Wasser. Temperatur, Härte und Mineralgehalt beeinflussen das Endresultat massgeblich. Ideale Wassertemperatur: 90–96 °C.",
  },
  {
    num: "03",
    title: "Mahlgrad bestimmt das Ergebnis",
    body: "Jede Brühmethode verlangt einen anderen Mahlgrad. Espresso braucht feines Mahlgut, French Press grobes — der richtige Mahlgrad ist die Grundlage jeder guten Tasse.",
  },
];

export default function BrewingGuidesPage() {
  return (
    <div className="min-h-screen bg-[#fdf9f4]">
      <Nav />
      <MobileNav />

      {/* Hero */}
      <section className="pt-24 pb-12 max-w-5xl mx-auto px-6">
        <p className="font-sans text-[#795900] font-semibold uppercase tracking-widest text-sm mb-3">
          Brühmethoden &amp; Wissen
        </p>
        <h1 className="font-serif text-4xl md:text-6xl text-[#341706] leading-tight">
          Brewing Guides —{" "}
          <span className="text-[#795900]">Meistere dein Handwerk</span>
        </h1>
      </section>

      {/* Featured guide card */}
      <section className="max-w-5xl mx-auto px-6 pb-12">
        <Link href="/brewing-guides/die-perfekte-extraktion" className="group block relative rounded-2xl overflow-hidden">
          <div className="aspect-[21/9] relative">
            <img
              src={HERO_IMG}
              alt="Die perfekte Extraktion"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#341706]/70 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12">
              <span className="inline-block bg-[#795900] text-white font-sans text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-4">
                Espresso
              </span>
              <h2 className="font-serif text-3xl md:text-5xl text-white mb-3">
                Die perfekte Extraktion
              </h2>
              <p className="font-sans text-white/80 text-base max-w-md">
                Lernen Sie, was hinter dem idealen Espresso-Shot steckt — von der Physik
                bis zur Praxis.
              </p>
            </div>
          </div>
        </Link>
      </section>

      {/* Category grid */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-serif text-2xl text-[#341706] mb-6">Brühmethoden entdecken</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.title}
              href={`/brewing-guides/${cat.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
              className="group block relative rounded-xl overflow-hidden"
            >
              <div className="aspect-[4/3] relative">
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#341706]/75 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="font-serif text-xl text-white">{cat.title}</h3>
                  <p className="font-sans text-white/75 text-sm mt-1">{cat.subtitle}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Educational section */}
      <section className="bg-white border-t border-[#d5c3bb]/40">
        <div className="max-w-5xl mx-auto px-6 py-16">
          <h2 className="font-serif text-3xl text-[#341706] mb-10">
            Warum die Brühmethode entscheidend ist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {brewingPoints.map((pt) => (
              <div key={pt.num} className="flex gap-5">
                <span className="font-serif text-4xl text-[#d5c3bb] leading-none select-none">
                  {pt.num}
                </span>
                <div>
                  <h3 className="font-sans font-semibold text-[#341706] mb-2">{pt.title}</h3>
                  <p className="font-sans text-[#51443e] text-sm leading-relaxed">{pt.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
