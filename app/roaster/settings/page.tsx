"use client";
import { useState } from "react";
import RoasterSidebar from "@/components/RoasterSidebar";

const sections = [
  { id: "profil", label: "Profil" },
  { id: "abo", label: "Abonnement" },
  { id: "noti", label: "Benachrichtigungen" },
  { id: "integrationen", label: "Integrationen" },
  { id: "team", label: "Team" },
];

export default function RoasterSettingsPage() {
  const [active, setActive] = useState("profil");
  const [notifications, setNotifications] = useState({ orders: true, shipping: true, weekly: false });

  return (
    <div className="bg-background min-h-screen">
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16 bg-[#fdf9f4] border-b border-outline-variant/20">
        <h1 className="font-headline text-xl text-primary tracking-tight">Atelier Espresso</h1>
        <div className="w-10 h-10 rounded-full bg-surface-container ring-1 ring-outline-variant/20" />
      </header>
      <RoasterSidebar />

      <main className="md:pl-64 pt-24 px-8 pb-16">
        <div className="mb-12">
          <span className="font-label text-[10px] uppercase tracking-[0.2em] text-secondary font-bold block mb-2">Settings</span>
          <h2 className="font-headline text-4xl text-primary tracking-tighter">Einstellungen</h2>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Sub-nav */}
          <aside className="md:col-span-3">
            <div className="space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg font-label text-sm transition-all ${
                    active === s.id
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </aside>

          {/* Content */}
          <div className="md:col-span-9 space-y-6">
            {active === "profil" && (
              <>
                <div className="bg-surface-container-lowest p-8 rounded-xl">
                  <h3 className="font-headline text-xl text-primary mb-6">Rösterei-Profil</h3>
                  <div className="grid gap-6">
                    <Field label="Rösterei-Name" defaultValue="Atelier Espresso" />
                    <Field label="Adresse" defaultValue="Bahnhofstrasse 12, 8001 Zürich" />
                    <div>
                      <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">Bio</label>
                      <textarea
                        defaultValue="Handwerkliche Rösterei aus dem Herzen von Zürich. Direct Trade seit 2018."
                        rows={4}
                        className="w-full bg-surface-container px-4 py-3 rounded-lg border border-outline-variant focus:border-secondary outline-none font-body text-sm"
                      />
                    </div>
                    <Field label="Website" defaultValue="atelier-espresso.ch" />
                    <Field label="Email" defaultValue="hello@atelier-espresso.ch" />
                    <Field label="Telefon" defaultValue="+41 44 123 45 67" />
                  </div>
                  <button className="mt-8 bg-primary text-on-primary px-8 py-3 rounded-lg font-label text-xs uppercase tracking-widest hover:opacity-90 transition-all">
                    Speichern
                  </button>
                </div>
              </>
            )}

            {active === "noti" && (
              <div className="bg-surface-container-lowest p-8 rounded-xl">
                <h3 className="font-headline text-xl text-primary mb-6">Benachrichtigungen</h3>
                <div className="space-y-4">
                  {[
                    { key: "orders", label: "Neue Bestellungen", desc: "Sofort-Benachrichtigung bei neuen Aufträgen" },
                    { key: "shipping", label: "Lieferungsstatus", desc: "Updates zu Versand und Zustellung" },
                    { key: "weekly", label: "Wöchentlicher Report", desc: "Performance-Zusammenfassung jeden Montag" },
                  ].map((n) => (
                    <div key={n.key} className="flex items-center justify-between py-4 border-b border-outline-variant/10 last:border-0">
                      <div>
                        <div className="font-headline text-base text-primary">{n.label}</div>
                        <div className="font-light text-sm text-on-surface-variant">{n.desc}</div>
                      </div>
                      <button
                        onClick={() => setNotifications((p) => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          notifications[n.key as keyof typeof notifications] ? "bg-secondary" : "bg-outline-variant"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            notifications[n.key as keyof typeof notifications] ? "translate-x-6" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(active === "abo" || active === "integrationen" || active === "team") && (
              <div className="bg-surface-container-lowest p-12 rounded-xl text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-4 block">construction</span>
                <p className="font-light text-on-surface-variant">Diese Sektion ist in Arbeit.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <label className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant block mb-2">{label}</label>
      <input
        defaultValue={defaultValue}
        className="w-full bg-surface-container px-4 py-3 rounded-lg border border-outline-variant focus:border-secondary outline-none font-body text-sm"
      />
    </div>
  );
}
