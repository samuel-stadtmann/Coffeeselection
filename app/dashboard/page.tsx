"use client";

import Link from "next/link";
import Nav from "@/components/Nav";
import MobileNav from "@/components/MobileNav";

const cardClass = "bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background font-sans">
      <Nav />

      <main className="pt-24 pb-32 px-4 max-w-4xl mx-auto">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="font-headline font-serif text-3xl text-on-surface mb-1">
            Guten Morgen, Marco.
          </h1>
          <p className="font-sans text-on-surface-variant text-base">
            Dein Kaffee-Profil auf einen Blick.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Taste Type — wide */}
          <div className={`${cardClass} md:col-span-2`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="font-label text-on-surface-variant text-xs uppercase tracking-widest mb-1">
                  Geschmackstyp
                </p>
                <h2 className="font-headline font-serif text-2xl text-on-surface">
                  Vibrant Explorer
                </h2>
              </div>
              <div className="flex flex-col items-end gap-1">
                <p className="font-label text-on-surface-variant text-xs">Profil-Vollständigkeit</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 rounded-full bg-surface-container-high overflow-hidden">
                    <div className="h-full bg-secondary rounded-full" style={{ width: "78%" }} />
                  </div>
                  <span className="font-label font-semibold text-secondary text-sm">78%</span>
                </div>
              </div>
            </div>

            {/* Radar Chart Placeholder */}
            <div className="flex justify-center py-4">
              <svg width="160" height="160" viewBox="0 0 160 160">
                {[72, 56, 40, 24].map((r, i) => (
                  <circle
                    key={i}
                    cx="80"
                    cy="80"
                    r={r}
                    fill="none"
                    stroke="#d5c3bb"
                    strokeWidth="1"
                  />
                ))}
                {/* Axis lines */}
                {[0, 60, 120, 180, 240, 300].map((deg) => {
                  const rad = (deg * Math.PI) / 180;
                  return (
                    <line
                      key={deg}
                      x1="80"
                      y1="80"
                      x2={80 + 72 * Math.cos(rad)}
                      y2={80 + 72 * Math.sin(rad)}
                      stroke="#d5c3bb"
                      strokeWidth="1"
                    />
                  );
                })}
                {/* Radar fill */}
                <polygon
                  points="80,20 128,55 112,108 48,108 32,55"
                  fill="#79590022"
                  stroke="#795900"
                  strokeWidth="2"
                />
                {/* Radar dots */}
                {[
                  [80, 20],
                  [128, 55],
                  [112, 108],
                  [48, 108],
                  [32, 55],
                ].map(([x, y], i) => (
                  <circle key={i} cx={x} cy={y} r="4" fill="#795900" />
                ))}
              </svg>
            </div>

            <div className="flex gap-6 justify-center mt-2">
              {["Säure", "Süsse", "Körper", "Röstung", "Komplexität"].map((label) => (
                <span key={label} className="font-label text-on-surface-variant text-xs">
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Current Subscription */}
          <div className={cardClass}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary text-lg">autorenew</span>
              <p className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-widest">
                Aktuelles Abo
              </p>
            </div>
            <p className="font-headline font-serif text-on-surface text-xl mb-1">
              Ethiopia Yirgacheffe
            </p>
            <p className="font-sans text-on-surface-variant text-sm mb-4">250g · monatlich</p>

            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary text-base">schedule</span>
              <p className="font-sans text-on-surface text-sm">
                Nächste Lieferung <span className="font-semibold">in 12 Tagen</span>
              </p>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-sans font-bold text-on-surface text-base">CHF 24.90</span>
              <Link
                href="/roaster/settings"
                className="font-label text-secondary text-sm font-semibold hover:underline"
              >
                Lieferung anpassen
              </Link>
            </div>
          </div>

          {/* Last Rating */}
          <div className={cardClass}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary text-lg">star</span>
              <p className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-widest">
                Letzte Bewertung
              </p>
            </div>

            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className="material-symbols-outlined text-secondary-container text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
              ))}
            </div>

            <p className="font-sans text-on-surface-variant text-sm mb-4">
              Ethiopia Yirgacheffe — vor 3 Tagen
            </p>

            <Link
              href="/insights"
              className="inline-flex items-center gap-1 font-label text-secondary text-sm font-semibold hover:underline"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Tasting Notes hinzufügen
            </Link>
          </div>

          {/* Recommendation */}
          <div className={`${cardClass} relative overflow-hidden`}>
            <div className="absolute top-4 right-4 bg-secondary-container text-on-surface text-xs font-label font-semibold px-3 py-1 rounded-full">
              87% Match
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary text-lg">recommend</span>
              <p className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-widest">
                Empfehlung
              </p>
            </div>
            <p className="font-label font-semibold text-on-surface-variant text-xs mb-2">
              Neue Empfehlung
            </p>
            <p className="font-headline font-serif text-on-surface text-lg mb-1">
              Guatemala Huehuetenango
            </p>
            <p className="font-sans text-on-surface-variant text-sm mb-4">
              Schokolade · Nuss · Karamell
            </p>
            <button className="w-full py-3 bg-primary text-white font-label font-semibold rounded-xl text-sm uppercase tracking-widest">
              Jetzt entdecken
            </button>
          </div>

          {/* Quick Actions */}
          <div className={cardClass}>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-secondary text-lg">bolt</span>
              <p className="font-label font-semibold text-on-surface-variant text-xs uppercase tracking-widest">
                Schnellaktionen
              </p>
            </div>
            <div className="space-y-2">
              <Link
                href="/quiz"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-secondary text-xl">quiz</span>
                <span className="font-sans text-on-surface text-sm font-medium">Quiz wiederholen</span>
                <span className="material-symbols-outlined text-on-surface-variant text-base ml-auto">chevron_right</span>
              </Link>
              <Link
                href="/brewing-guides"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-secondary text-xl">menu_book</span>
                <span className="font-sans text-on-surface text-sm font-medium">Rezepte</span>
                <span className="material-symbols-outlined text-on-surface-variant text-base ml-auto">chevron_right</span>
              </Link>
              <Link
                href="/roaster/settings"
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low transition-colors"
              >
                <span className="material-symbols-outlined text-secondary text-xl">settings</span>
                <span className="font-sans text-on-surface text-sm font-medium">Einstellungen</span>
                <span className="material-symbols-outlined text-on-surface-variant text-base ml-auto">chevron_right</span>
              </Link>
            </div>
          </div>

        </div>
      </main>

      <MobileNav />
    </div>
  );
}
