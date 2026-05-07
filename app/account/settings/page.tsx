"use client";
import { useState } from "react";
import Link from "next/link";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";

export default function Page() {
  const [notifications, setNotifications] = useState({ shipping: true, recommendations: true, newsletter: false, sms: false });
  const [language, setLanguage] = useState("de-CH");

  return (
    <AccountLayout>
      <PageHeader subtitle="Einstellungen" title="Konto-Einstellungen" description="Verwalte E-Mail, Passwort, Benachrichtigungen und Datenschutz." />

      {/* Account */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Konto</h3>
        <div className="space-y-5">
          <div>
            <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">Vorname</label>
            <input defaultValue="Marco" className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base" />
          </div>
          <div>
            <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">Nachname</label>
            <input defaultValue="Keller" className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base" />
          </div>
          <div>
            <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">E-Mail</label>
            <input defaultValue="marco@example.ch" className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base" />
          </div>
          <div>
            <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">Telefon (optional)</label>
            <input placeholder="+41 79 ..." className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base" />
          </div>
          <button className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all">
            Speichern
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Passwort ändern</h3>
        <div className="space-y-4">
          <input type="password" placeholder="Aktuelles Passwort" className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base" />
          <input type="password" placeholder="Neues Passwort" className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base" />
          <input type="password" placeholder="Neues Passwort bestätigen" className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base" />
          <button className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all">
            Passwort ändern
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Benachrichtigungen</h3>
        <div className="divide-y divide-surface-container">
          {[
            { key: "shipping", label: "Liefer-Updates", desc: "Bestätigungen, Versand und Zustellung" },
            { key: "recommendations", label: "Neue Empfehlungen", desc: "Wenn der Algorithmus einen neuen Match findet" },
            { key: "newsletter", label: "Newsletter", desc: "Coffee-Stories, Röster-News, Trends" },
            { key: "sms", label: "SMS-Benachrichtigungen", desc: "Nur Liefer-Updates per SMS" },
          ].map((n) => (
            <div key={n.key} className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-headline font-bold text-primary uppercase tracking-tight">{n.label}</p>
                <p className="text-xs text-on-surface-variant">{n.desc}</p>
              </div>
              <button
                onClick={() => setNotifications((p) => ({ ...p, [n.key]: !p[n.key as keyof typeof p] }))}
                className={`w-12 h-6 rounded-full transition-colors shrink-0 ${notifications[n.key as keyof typeof notifications] ? "bg-tertiary" : "bg-surface-container"}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications[n.key as keyof typeof notifications] ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Language */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Sprache</h3>
        <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full md:w-auto bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base">
          <option value="de-CH">Deutsch (CH)</option>
          <option value="fr-CH">Français (CH)</option>
          <option value="it-CH">Italiano (CH)</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Privacy */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Datenschutz</h3>
        <div className="space-y-3">
          <button className="block w-full text-left p-4 border-2 border-surface-container hover:border-tertiary transition-all">
            <span className="font-headline font-bold text-primary uppercase tracking-tight text-sm block mb-1">Meine Daten exportieren</span>
            <span className="text-xs text-on-surface-variant">Erhalte alle deine Daten als JSON-Datei (DSGVO)</span>
          </button>
          <button className="block w-full text-left p-4 border-2 border-error/20 hover:border-error transition-all">
            <span className="font-headline font-bold text-error uppercase tracking-tight text-sm block mb-1">Konto löschen</span>
            <span className="text-xs text-on-surface-variant">Alle Daten werden permanent gelöscht. Diese Aktion ist nicht rückgängig zu machen.</span>
          </button>
        </div>
      </div>

      <Link href="/account/dashboard" className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block">
        ← Zurück zum Dashboard
      </Link>
    </AccountLayout>
  );
}
