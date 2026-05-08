"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AccountLayout, { PageHeader } from "@/components/AccountLayout";
import { createClient } from "@/lib/supabase/client";

type ProfileForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  language: string;
};

const NOTIFICATION_DEFS = [
  { key: "shipping", label: "Liefer-Updates", desc: "Bestätigungen, Versand und Zustellung" },
  { key: "recommendations", label: "Neue Empfehlungen", desc: "Wenn der Algorithmus einen neuen Match findet" },
  { key: "newsletter", label: "Newsletter", desc: "Coffee-Stories, Röster-News, Trends" },
  { key: "sms", label: "SMS-Benachrichtigungen", desc: "Nur Liefer-Updates per SMS" },
] as const;

export default function Page() {
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [notifications, setNotifications] = useState({ shipping: true, recommendations: true, newsletter: false, sms: false });

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setAuthUserId(auth.user.id);
      const { data } = await supabase
        .from("customers")
        .select("first_name, last_name, phone, language")
        .eq("auth_user_id", auth.user.id)
        .single();
      setForm({
        firstName: data?.first_name ?? "",
        lastName: data?.last_name ?? "",
        email: auth.user.email ?? "",
        phone: data?.phone ?? "",
        language: data?.language ?? "de-CH",
      });
    })();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !authUserId) return;
    setProfileMsg(null);
    setSavingProfile(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("customers")
      .update({
        first_name: form.firstName.trim() || null,
        last_name: form.lastName.trim() || null,
        phone: form.phone.trim() || null,
        language: form.language,
      })
      .eq("auth_user_id", authUserId);
    setSavingProfile(false);
    if (error) {
      setProfileMsg({ type: "err", text: error.message });
      return;
    }
    setProfileMsg({ type: "ok", text: "Gespeichert." });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw.length < 8) {
      setPwMsg({ type: "err", text: "Neues Passwort muss mindestens 8 Zeichen lang sein." });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ type: "err", text: "Die neuen Passwörter stimmen nicht überein." });
      return;
    }
    setSavingPw(true);
    const supabase = createClient();
    // Re-Authentifizierung mit aktuellem Passwort, falls Email vorhanden
    if (form?.email && currentPw) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: currentPw,
      });
      if (signInError) {
        setSavingPw(false);
        setPwMsg({ type: "err", text: "Aktuelles Passwort ist falsch." });
        return;
      }
    }
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSavingPw(false);
    if (error) {
      setPwMsg({ type: "err", text: error.message });
      return;
    }
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    setPwMsg({ type: "ok", text: "Passwort aktualisiert." });
  };

  return (
    <AccountLayout>
      <PageHeader subtitle="Einstellungen" title="Konto-Einstellungen" description="Verwalte E-Mail, Passwort, Benachrichtigungen und Datenschutz." />

      {/* Profile */}
      <form onSubmit={handleProfileSubmit} className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Konto</h3>
        {!form ? (
          <p className="text-sm text-on-surface-variant">Lade…</p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">Vorname</label>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                />
              </div>
              <div>
                <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">Nachname</label>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
                />
              </div>
            </div>
            <div>
              <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">E-Mail</label>
              <input
                value={form.email}
                disabled
                className="w-full bg-surface-container/50 px-4 py-3 border-b-2 border-tertiary/0 outline-none font-body text-base text-on-surface-variant"
              />
              <p className="text-xs text-on-surface-variant/60 mt-1">Email kann nicht direkt geändert werden — bitte Support kontaktieren.</p>
            </div>
            <div>
              <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">Telefon (optional)</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+41 79 ..."
                className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
              />
            </div>
            <div>
              <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">Sprache</label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full md:w-auto bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
              >
                <option value="de-CH">Deutsch (CH)</option>
                <option value="fr-CH">Français (CH)</option>
                <option value="it-CH">Italiano (CH)</option>
                <option value="en">English</option>
              </select>
            </div>

            {profileMsg && (
              <div className={`px-4 py-3 text-sm border-l-4 ${profileMsg.type === "ok" ? "bg-tertiary/10 border-tertiary text-primary" : "bg-error/10 border-error text-primary"}`}>
                {profileMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
            >
              {savingProfile ? "Wird gespeichert…" : "Speichern"}
            </button>
          </div>
        )}
      </form>

      {/* Password */}
      <form onSubmit={handlePasswordChange} className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Passwort ändern</h3>
        <div className="space-y-4">
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            placeholder="Aktuelles Passwort"
            autoComplete="current-password"
            className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
          />
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            placeholder="Neues Passwort (mind. 8 Zeichen)"
            minLength={8}
            autoComplete="new-password"
            className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
          />
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            placeholder="Neues Passwort bestätigen"
            minLength={8}
            autoComplete="new-password"
            className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
          />

          {pwMsg && (
            <div className={`px-4 py-3 text-sm border-l-4 ${pwMsg.type === "ok" ? "bg-tertiary/10 border-tertiary text-primary" : "bg-error/10 border-error text-primary"}`}>
              {pwMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={savingPw}
            className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
          >
            {savingPw ? "Wird geändert…" : "Passwort ändern"}
          </button>
        </div>
      </form>

      {/* Notifications */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Benachrichtigungen</h3>
        <p className="text-xs text-on-surface-variant mb-4">Wird in Phase 3 mit DB verbunden.</p>
        <div className="divide-y divide-surface-container">
          {NOTIFICATION_DEFS.map((n) => (
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
