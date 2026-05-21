"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

type AddressForm = {
  // null wenn der Customer noch keine Default-Lieferadresse hat — dann
  // legt der Save eine neue Zeile an statt zu updaten.
  id: string | null;
  recipient_name: string;
  company: string;
  street: string;
  street_additional: string;
  postal_code: string;
  city: string;
  region: string;
  country: string;
  delivery_instructions: string;
};

const EMPTY_ADDRESS: AddressForm = {
  id: null,
  recipient_name: "",
  company: "",
  street: "",
  street_additional: "",
  postal_code: "",
  city: "",
  region: "",
  country: "CH",
  delivery_instructions: "",
};

type NotificationKey = "notify_shipping" | "notify_recommendations" | "marketing_opt_in";

type NotificationFlags = Record<NotificationKey, boolean>;

const NOTIFICATION_DEFS: Array<{ key: NotificationKey; label: string; desc: string }> = [
  { key: "notify_shipping", label: "Liefer-Updates", desc: "Bestätigungen, Versand und Zustellung" },
  { key: "notify_recommendations", label: "Neue Empfehlungen", desc: "Wenn der Algorithmus einen neuen Match findet" },
  { key: "marketing_opt_in", label: "Newsletter", desc: "Coffee-Stories, Röster-News, Trends — wird mit der Resend-Audience synchronisiert" },
];

export default function Page() {
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressMsg, setAddressMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationFlags>({
    notify_shipping: true,
    notify_recommendations: true,
    marketing_opt_in: false,
  });
  const [savingNotif, setSavingNotif] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      setAuthUserId(auth.user.id);
      const { data } = await supabase
        .from("customers")
        .select("id, first_name, last_name, phone, language, notify_shipping, notify_recommendations, marketing_opt_in")
        .eq("auth_user_id", auth.user.id)
        .single();
      if (data?.id) setCustomerId(data.id);
      setForm({
        firstName: data?.first_name ?? "",
        lastName: data?.last_name ?? "",
        email: auth.user.email ?? "",
        phone: data?.phone ?? "",
        language: data?.language ?? "de-CH",
      });
      setNotifications({
        notify_shipping: data?.notify_shipping ?? true,
        notify_recommendations: data?.notify_recommendations ?? true,
        marketing_opt_in: data?.marketing_opt_in ?? false,
      });

      // Default-Lieferadresse laden. RLS sorgt dass nur die eigenen
      // Adressen sichtbar sind. Bevorzugt is_default=true, sonst neueste
      // shipping-Adresse, sonst leer (User legt eine an).
      if (data?.id) {
        const { data: addrs } = await supabase
          .from("customer_addresses")
          .select(
            "id, recipient_name, company, street, street_additional, postal_code, city, region, country, delivery_instructions, is_default, type, created_at"
          )
          .eq("customer_id", data.id)
          .in("type", ["shipping", "both"])
          .order("is_default", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1);
        const a = (addrs ?? [])[0];
        if (a) {
          setAddress({
            id: a.id as string,
            recipient_name: a.recipient_name ?? "",
            company: a.company ?? "",
            street: a.street ?? "",
            street_additional: a.street_additional ?? "",
            postal_code: a.postal_code ?? "",
            city: a.city ?? "",
            region: a.region ?? "",
            country: a.country ?? "CH",
            delivery_instructions: a.delivery_instructions ?? "",
          });
        }
      }
    })();
  }, []);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) return;
    if (savingAddress) return;
    setAddressMsg(null);
    setSavingAddress(true);
    const supabase = createClient();
    const payload = {
      customer_id: customerId,
      type: "shipping" as const,
      is_default: true,
      recipient_name: address.recipient_name.trim(),
      company: address.company.trim() || null,
      street: address.street.trim(),
      street_additional: address.street_additional.trim() || null,
      postal_code: address.postal_code.trim(),
      city: address.city.trim(),
      region: address.region.trim() || null,
      country: address.country.trim() || "CH",
      delivery_instructions: address.delivery_instructions.trim() || null,
    };
    // is_default ist normalerweise UNIQUE partial per (customer_id, type,
    // is_default=true). Wir setzen daher andere shipping-Defaults vorher
    // auf false, dann insert/update.
    await supabase
      .from("customer_addresses")
      .update({ is_default: false })
      .eq("customer_id", customerId)
      .in("type", ["shipping", "both"])
      .eq("is_default", true);
    let saveErr: string | null = null;
    if (address.id) {
      const { error } = await supabase
        .from("customer_addresses")
        .update(payload)
        .eq("id", address.id);
      if (error) saveErr = error.message;
    } else {
      const { data: ins, error } = await supabase
        .from("customer_addresses")
        .insert(payload)
        .select("id")
        .single();
      if (error) saveErr = error.message;
      else if (ins) setAddress((a) => ({ ...a, id: ins.id as string }));
    }
    setSavingAddress(false);
    if (saveErr) {
      setAddressMsg({ type: "err", text: saveErr });
    } else {
      setAddressMsg({ type: "ok", text: "Adresse gespeichert." });
    }
  };

  const toggleNotification = async (key: NotificationKey) => {
    if (savingNotif) return;
    const next = { ...notifications, [key]: !notifications[key] };
    setNotifications(next);
    setSavingNotif(true);
    await fetch("/api/account/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: next[key] }),
    });
    setSavingNotif(false);
  };

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) throw new Error("Export fehlgeschlagen");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `coffee-selection-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Fehler");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    setDeleteError(null);
    if (deleteConfirm !== "LÖSCHEN") {
      setDeleteError("Bitte tippe LÖSCHEN zur Bestätigung ein.");
      return;
    }
    setDeleting(true);
    const res = await fetch("/api/account/delete", { method: "POST" });
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      setDeleteError(j?.details ?? j?.error ?? "Löschen fehlgeschlagen");
      setDeleting(false);
      return;
    }
    // Erfolgreich → ausloggen und Home
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

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

      {/* Standard-Lieferadresse */}
      <form onSubmit={handleAddressSubmit} className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2">
          Standard-Lieferadresse
        </h3>
        <p className="text-sm text-on-surface-variant mb-6">
          Wird beim Checkout automatisch vorausgefüllt. Du kannst dort jederzeit eine andere
          Adresse eingeben — der Standard hier bleibt unverändert.
        </p>
        <div className="space-y-4">
          <div>
            <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
              Empfänger*in
            </label>
            <input
              required
              value={address.recipient_name}
              onChange={(e) => setAddress({ ...address, recipient_name: e.target.value })}
              autoComplete="name"
              className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
            />
          </div>
          <div>
            <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
              Firma (optional)
            </label>
            <input
              value={address.company}
              onChange={(e) => setAddress({ ...address, company: e.target.value })}
              autoComplete="organization"
              className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
            />
          </div>
          <div>
            <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
              Strasse + Nr.
            </label>
            <input
              required
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              autoComplete="address-line1"
              className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
            />
          </div>
          <div>
            <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
              Adresszusatz (optional)
            </label>
            <input
              value={address.street_additional}
              onChange={(e) => setAddress({ ...address, street_additional: e.target.value })}
              autoComplete="address-line2"
              className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                PLZ
              </label>
              <input
                required
                value={address.postal_code}
                onChange={(e) =>
                  setAddress({ ...address, postal_code: e.target.value.trim() })
                }
                autoComplete="postal-code"
                className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
              />
            </div>
            <div>
              <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                Stadt
              </label>
              <input
                required
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                autoComplete="address-level2"
                className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
              />
            </div>
            <div>
              <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
                Kanton (optional)
              </label>
              <input
                value={address.region}
                onChange={(e) => setAddress({ ...address, region: e.target.value })}
                autoComplete="address-level1"
                className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
              />
            </div>
          </div>
          <div>
            <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
              Land
            </label>
            <select
              value={address.country}
              onChange={(e) => setAddress({ ...address, country: e.target.value })}
              className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
            >
              <option value="CH">Schweiz</option>
              <option value="LI">Liechtenstein</option>
            </select>
          </div>
          <div>
            <label className="font-headline text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold block mb-2">
              Lieferhinweis (optional)
            </label>
            <input
              value={address.delivery_instructions}
              onChange={(e) =>
                setAddress({ ...address, delivery_instructions: e.target.value })
              }
              placeholder="z.B. Bei Nachbar abgeben, 2. Stock links"
              className="w-full bg-surface-container px-4 py-3 border-b-2 border-tertiary/0 focus:border-tertiary outline-none font-body text-base"
            />
          </div>
          {addressMsg && (
            <div
              className={`px-4 py-3 text-sm border-l-4 ${
                addressMsg.type === "ok"
                  ? "bg-tertiary/10 border-tertiary text-primary"
                  : "bg-error/10 border-error text-primary"
              }`}
            >
              {addressMsg.text}
            </div>
          )}
          <button
            type="submit"
            disabled={savingAddress || !customerId}
            className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
          >
            {savingAddress ? "Wird gespeichert…" : "Adresse speichern"}
          </button>
        </div>
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
        <div className="divide-y divide-surface-container">
          {NOTIFICATION_DEFS.map((n) => (
            <div key={n.key} className="py-4 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-headline font-bold text-primary uppercase tracking-tight">{n.label}</p>
                <p className="text-xs text-on-surface-variant">{n.desc}</p>
              </div>
              <button
                onClick={() => toggleNotification(n.key)}
                disabled={savingNotif}
                className={`w-12 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60 ${
                  notifications[n.key] ? "bg-tertiary" : "bg-surface-container"
                }`}
                aria-pressed={notifications[n.key]}
                aria-label={n.label}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notifications[n.key] ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-white p-6 md:p-8 shadow-sm">
        <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-6">Datenschutz</h3>
        <div className="space-y-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="block w-full text-left p-4 border-2 border-surface-container hover:border-tertiary transition-all disabled:opacity-60"
          >
            <span className="font-headline font-bold text-primary uppercase tracking-tight text-sm block mb-1">
              {exporting ? "Wird vorbereitet…" : "Meine Daten exportieren"}
            </span>
            <span className="text-xs text-on-surface-variant">
              JSON-Download mit allen deinen Daten (DSGVO Art. 20)
            </span>
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="block w-full text-left p-4 border-2 border-error/20 hover:border-error transition-all"
          >
            <span className="font-headline font-bold text-error uppercase tracking-tight text-sm block mb-1">
              Konto löschen
            </span>
            <span className="text-xs text-on-surface-variant">
              Personendaten werden anonymisiert, Bestell-Historie bleibt für die Buchhaltung. Aktion ist nicht rückgängig zu machen.
            </span>
          </button>
        </div>
      </div>

      {/* Delete-Modal */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white max-w-md w-full p-6 md:p-8 shadow-2xl">
            <h3 className="font-headline font-bold text-primary uppercase tracking-tight text-lg mb-2">
              Konto wirklich löschen?
            </h3>
            <p className="text-sm text-on-surface-variant mb-4">
              Deine personenbezogenen Daten werden anonymisiert und du wirst ausgeloggt. Bestell-Historie bleibt für die Buchhaltung erhalten (CH 10 Jahre).
            </p>
            <p className="text-xs text-on-surface-variant mb-3">
              Tippe <strong>LÖSCHEN</strong> ein zum Bestätigen:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="LÖSCHEN"
              className="w-full bg-surface-container px-4 py-3 border-b-2 border-error/0 focus:border-error outline-none font-body text-base mb-3"
            />
            {deleteError && (
              <p className="text-xs text-red-600 font-headline uppercase tracking-widest mb-3">
                {deleteError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteConfirm("");
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="flex-1 border border-surface-container px-4 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-surface-container transition-all disabled:opacity-60"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || deleteConfirm !== "LÖSCHEN"}
                className="flex-1 bg-red-600 text-white px-4 py-3 font-headline font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-60"
              >
                {deleting ? "…" : "Endgültig löschen"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Link href="/account/dashboard" className="font-headline text-[11px] uppercase tracking-[0.2em] text-tertiary hover:text-primary transition-colors border-b-2 border-tertiary pb-1 inline-block">
        ← Zurück zum Dashboard
      </Link>
    </AccountLayout>
  );
}
