"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AROMA_FAMILIES,
  type AromaFamily,
  type CoffeeFormState,
  ROAST_LEVELS,
  SENSORY_AXES,
  slugify,
  tenToFive,
  validateCoffee,
} from "@/lib/coffee/form-helpers";

/**
 * Wiederverwendbares Coffee-Erfassungs-Formular.
 * Wird sowohl im Admin-Portal (`/admin/coffees/new`) als auch spaeter
 * im Roaster-Portal (`/roaster/coffees/new`) eingebunden.
 *
 * Props:
 *   - initial: optionaler Vorbefuellungs-State (fuer Edit-Pfad)
 *   - roasters: Auswahlliste (Admin kann jeden Roester waehlen;
 *     Roaster-Portal liefert nur den eigenen)
 *   - origins, varieties, processings, certifications: Catalog-Daten
 *   - submitEndpoint: 'POST' fuer create, 'PATCH' fuer edit
 *   - coffeeId: nur bei Edit-Pfad gesetzt
 *   - afterSaveHref: wohin nach erfolgreichem Save
 */
export type LookupOption = { id: string; label: string };

type Props = {
  initial: CoffeeFormState;
  roasters: LookupOption[];
  origins: LookupOption[];
  varieties: LookupOption[];
  processings: LookupOption[];
  allergens: Array<{ slug: string; label: string }>;
  certifications: LookupOption[];
  submitEndpoint: string;          // z.B. "/api/admin/coffees" oder "/api/admin/coffees/<id>"
  submitMethod: "POST" | "PATCH";
  afterSaveHref: string;
};

export default function CoffeeForm({
  initial,
  roasters,
  origins,
  varieties,
  processings,
  allergens,
  certifications,
  submitEndpoint,
  submitMethod,
  afterSaveHref,
}: Props) {
  const router = useRouter();
  const [s, setS] = useState<CoffeeFormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Slug automatisch aus name ableiten wenn slug noch leer
  function onNameChange(v: string) {
    setS((prev) => ({
      ...prev,
      name: v,
      slug: prev.slug || slugify(v),
    }));
  }

  const issues = useMemo(() => validateCoffee(s), [s]);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warn");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError(null);
    if (errors.length > 0) {
      setServerError("Bitte zuerst die rot markierten Fehler beheben.");
      return;
    }
    if (warnings.length > 0) {
      const ok = confirm(
        `${warnings.length} Warnung(en) — trotzdem speichern?\n\n` +
          warnings.map((w) => `• ${w.message}`).join("\n")
      );
      if (!ok) return;
    }

    setSubmitting(true);
    try {
      // Sensorik-Achsen kommen im Form als 1-10 (Roester-Cupping-Skala),
      // die DB will 1-5 (SCA). Konvertieren bevor wir senden.
      const payload = {
        ...s,
        acidity: tenToFive(s.acidity),
        body: tenToFive(s.body),
        sweetness: tenToFive(s.sweetness),
        bitterness: tenToFive(s.bitterness),
        complexity: tenToFive(s.complexity),
      };
      const res = await fetch(submitEndpoint, {
        method: submitMethod,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; details?: unknown };
        setServerError(
          body.error === "reauth_required"
            ? "Re-Auth abgelaufen — bitte einmal /admin neu öffnen."
            : body.error === "invalid_body"
              ? `Eingaben ungültig: ${JSON.stringify(body.details ?? "")}`
              : body.error ?? `HTTP ${res.status}`
        );
        setSubmitting(false);
        return;
      }
      router.push(afterSaveHref);
      router.refresh();
    } catch (err) {
      setServerError((err as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-10 max-w-4xl">
      {/* Stammdaten */}
      <Section title="Stammdaten">
        <Field label="Name *">
          <input
            type="text"
            value={s.name}
            onChange={(e) => onNameChange(e.target.value)}
            required
            className="form-input"
            placeholder="z.B. Yirgacheffe Reko Washed"
          />
        </Field>
        <Field
          label="Slug (URL-Fragment) *"
          hint='Wird Teil der URL: coffeeselection.ch/coffee/<slug>. Nur Kleinbuchstaben, Zahlen und Bindestriche. Keine Leerzeichen, Umlaute oder Sonderzeichen. Beispiel: "yirgacheffe-reko-washed". Wird automatisch aus dem Namen erzeugt — kannst du aber überschreiben.'
        >
          <input
            type="text"
            value={s.slug}
            onChange={(e) => setS({ ...s, slug: e.target.value })}
            required
            className="form-input font-mono text-sm"
            placeholder="z.B. yirgacheffe-reko-washed"
          />
        </Field>
        <Field label="Röster *">
          <select
            value={s.roaster_id}
            onChange={(e) => setS({ ...s, roaster_id: e.target.value })}
            required
            className="form-input"
          >
            <option value="">— Röster auswählen —</option>
            {roasters.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Kurz-Pitch (1 Satz, für Coffee-Karten)" hint="Max 200 Zeichen, prägnant.">
          <input
            type="text"
            value={s.short_description}
            onChange={(e) => setS({ ...s, short_description: e.target.value })}
            maxLength={500}
            className="form-input"
          />
        </Field>
        <Field label="Beschreibung (Detail-Seite, Markdown ok)">
          <textarea
            value={s.description}
            onChange={(e) => setS({ ...s, description: e.target.value })}
            rows={3}
            className="form-input"
          />
        </Field>
      </Section>

      {/* Geschmacks-Beschreibung — feeds Embedding */}
      <Section
        title="Geschmacks-Beschreibung"
        sub="Diese Texte gehen direkt ins OpenAI-Embedding und beeinflussen welchen Customer wir matchen. Je präziser, desto besser."
      >
        <Field label="Flavor-Description (für Algorithmus)" hint="z.B. 'Bergamotte, weißer Pfirsich, Jasmin, Tee-artiger Körper'">
          <textarea
            value={s.flavor_description}
            onChange={(e) => setS({ ...s, flavor_description: e.target.value })}
            rows={3}
            className="form-input"
            placeholder="Konkrete Aromen, Mundgefühl, Abgang…"
          />
        </Field>
        <Field label="Tasting-Summary (1-2 Sätze für UI)">
          <input
            type="text"
            value={s.tasting_summary}
            onChange={(e) => setS({ ...s, tasting_summary: e.target.value })}
            className="form-input"
          />
        </Field>
      </Section>

      {/* Sensorik — Eingabe 1-10 (Roester-Cupping), wird zu 1-5 fuer Algorithmus konvertiert */}
      <Section
        title="Sensorik (Cupping-Skala 1–10)"
        sub="Das Herz des Algorithmus. Eingabe in der branchenüblichen 1-10-Skala. Wird beim Speichern automatisch auf die SCA-Skala 1-5 normalisiert (1+2→1, 3+4→2, 5+6→3, 7+8→4, 9+10→5)."
      >
        {SENSORY_AXES.map((ax) => {
          const value = s[ax.key];
          const sca = tenToFive(value);
          return (
            <Field
              key={ax.key}
              label={ax.label}
              hint={`${ax.hint1} · ${ax.hint10} · entspricht SCA-Wert ${sca}/5 für den Algorithmus`}
            >
              <input
                type="number"
                min={1}
                max={10}
                step={1}
                value={value}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  const clamped = Number.isFinite(raw)
                    ? Math.max(1, Math.min(10, Math.round(raw)))
                    : 6;
                  setS({ ...s, [ax.key]: clamped } as CoffeeFormState);
                }}
                className="form-input w-24"
              />
              <span className="ml-3 text-xs text-on-surface-variant">
                {value}/10 → SCA {sca}/5
              </span>
            </Field>
          );
        })}
      </Section>

      {/* Aroma-Familien */}
      <Section
        title="Aroma-Familien"
        sub="Multi-Select. Diese gehen ins compute_scoring_score — wähle nur was wirklich dominant ist."
      >
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {AROMA_FAMILIES.map((af) => {
            const checked = s.aroma_families.includes(af.slug);
            return (
              <label
                key={af.slug}
                className={
                  "flex items-center gap-2 px-3 py-2 border cursor-pointer transition-colors " +
                  (checked
                    ? "border-tertiary bg-tertiary/10 text-primary"
                    : "border-primary/10 hover:border-primary/30")
                }
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const set = new Set(s.aroma_families);
                    if (e.target.checked) set.add(af.slug);
                    else set.delete(af.slug);
                    setS({ ...s, aroma_families: Array.from(set) as AromaFamily[] });
                  }}
                />
                <span className="text-sm">{af.label}</span>
                <code className="ml-auto text-[10px] text-on-surface-variant/60">{af.slug}</code>
              </label>
            );
          })}
        </div>
      </Section>

      {/* Roest */}
      <Section title="Röstung">
        <Field label={`Röstgrad: ${s.roast_level}/5`} hint="1 = Light bis 5 = Dark">
          <div className="grid grid-cols-5 gap-2">
            {ROAST_LEVELS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setS({ ...s, roast_level: r.value })}
                className={
                  "px-3 py-3 text-sm border transition-colors " +
                  (s.roast_level === r.value
                    ? "border-tertiary bg-tertiary/10 text-primary font-bold"
                    : "border-primary/10 hover:border-primary/30")
                }
                title={r.hint}
              >
                <div className="font-headline text-[10px] uppercase tracking-widest font-bold">
                  {r.value}
                </div>
                <div className="text-xs mt-1">{r.label}</div>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Röst-Profil">
          <select
            value={s.roast_profile}
            onChange={(e) => setS({ ...s, roast_profile: e.target.value as CoffeeFormState["roast_profile"] })}
            className="form-input"
          >
            <option value="omni">Omni (universal)</option>
            <option value="filter">Filter</option>
            <option value="espresso">Espresso</option>
          </select>
        </Field>
        <Field label="Decaf?">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={s.is_decaf}
              onChange={(e) => setS({ ...s, is_decaf: e.target.checked })}
            />
            <span className="text-sm">Entkoffeiniert</span>
          </label>
        </Field>
        {s.is_decaf && (
          <Field label="Decaf-Methode">
            <select
              value={s.decaf_method}
              onChange={(e) => setS({ ...s, decaf_method: e.target.value as CoffeeFormState["decaf_method"] })}
              className="form-input"
            >
              <option value="">— wählen —</option>
              <option value="swiss_water">Swiss Water</option>
              <option value="co2">CO₂</option>
              <option value="sugarcane_ea">Sugarcane EA</option>
              <option value="solvent_ea">Solvent EA</option>
              <option value="other">Andere</option>
            </select>
          </Field>
        )}
        <Field label="Frisch-on-demand geröstet?" hint="z.B. Bündner Bohne röstet nach Bestellung">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={s.is_fresh_roast_on_demand}
              onChange={(e) => setS({ ...s, is_fresh_roast_on_demand: e.target.checked })}
            />
            <span className="text-sm">Wird auf Bestellung geröstet</span>
          </label>
        </Field>
      </Section>

      {/* Herkunft */}
      <Section title="Herkunft">
        <Field label="Origin (Herkunftsland)">
          <select
            value={s.origin_id ?? ""}
            onChange={(e) => setS({ ...s, origin_id: e.target.value || null })}
            className="form-input"
          >
            <option value="">— Optional —</option>
            {origins.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Region">
          <input type="text" value={s.region} onChange={(e) => setS({ ...s, region: e.target.value })} className="form-input" placeholder="z.B. Yirgacheffe" />
        </Field>
        <Field label="Farm">
          <input type="text" value={s.farm} onChange={(e) => setS({ ...s, farm: e.target.value })} className="form-input" />
        </Field>
        <Field label="Producer">
          <input type="text" value={s.producer} onChange={(e) => setS({ ...s, producer: e.target.value })} className="form-input" />
        </Field>
        <Field label="Varietät">
          <select
            value={s.variety_id ?? ""}
            onChange={(e) => setS({ ...s, variety_id: e.target.value || null })}
            className="form-input"
          >
            <option value="">— Optional —</option>
            {varieties.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Processing">
          <select
            value={s.processing_method_id ?? ""}
            onChange={(e) => setS({ ...s, processing_method_id: e.target.value || null })}
            className="form-input"
          >
            <option value="">— Optional —</option>
            {processings.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Höhe Min (m)">
            <input
              type="number"
              min={0}
              max={4000}
              value={s.altitude_m_min ?? ""}
              onChange={(e) => setS({ ...s, altitude_m_min: e.target.value ? Number(e.target.value) : null })}
              className="form-input"
            />
          </Field>
          <Field label="Höhe Max (m)">
            <input
              type="number"
              min={0}
              max={4000}
              value={s.altitude_m_max ?? ""}
              onChange={(e) => setS({ ...s, altitude_m_max: e.target.value ? Number(e.target.value) : null })}
              className="form-input"
            />
          </Field>
          <Field label="Ernte-Jahr">
            <input
              type="number"
              min={1900}
              max={2100}
              value={s.harvest_year ?? ""}
              onChange={(e) => setS({ ...s, harvest_year: e.target.value ? Number(e.target.value) : null })}
              className="form-input"
            />
          </Field>
        </div>
        <Field label="Lot-Number">
          <input type="text" value={s.lot_number} onChange={(e) => setS({ ...s, lot_number: e.target.value })} className="form-input" />
        </Field>
        <Field label="SCA-Score (0-100)">
          <input
            type="number"
            min={0}
            max={100}
            value={s.sca_score ?? ""}
            onChange={(e) => setS({ ...s, sca_score: e.target.value ? Number(e.target.value) : null })}
            className="form-input"
          />
        </Field>
      </Section>

      {/* Kommerz */}
      <Section title="Kommerz / Sortiment">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Preis CHF *">
            <input
              type="number"
              step="0.01"
              min={0}
              value={s.price_chf ?? ""}
              onChange={(e) => setS({ ...s, price_chf: e.target.value ? Number(e.target.value) : null })}
              required
              className="form-input"
            />
          </Field>
          <Field label="Gewicht (g) *">
            <input
              type="number"
              min={1}
              value={s.weight_g}
              onChange={(e) => setS({ ...s, weight_g: Number(e.target.value) })}
              required
              className="form-input"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Stock-Status">
            <select
              value={s.stock_status}
              onChange={(e) => setS({ ...s, stock_status: e.target.value as CoffeeFormState["stock_status"] })}
              className="form-input"
            >
              <option value="in_stock">Verfügbar</option>
              <option value="low_stock">Geringer Bestand</option>
              <option value="out_of_stock">Nicht verfügbar</option>
              <option value="discontinued">Discontinued</option>
            </select>
          </Field>
          <Field label="Stock (kg)" hint="Hartfilter: < 0.25 → eligible-Filter raus.">
            <input
              type="number"
              step="0.1"
              min={0}
              value={s.stock_kg ?? ""}
              onChange={(e) => setS({ ...s, stock_kg: e.target.value ? Number(e.target.value) : null })}
              className="form-input"
            />
          </Field>
        </div>
        <Field label="Min. Bestellmenge">
          <input
            type="number"
            min={1}
            value={s.min_order_qty}
            onChange={(e) => setS({ ...s, min_order_qty: Number(e.target.value) })}
            className="form-input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 mt-7">
            <input
              type="checkbox"
              checked={s.is_organic}
              onChange={(e) => setS({ ...s, is_organic: e.target.checked })}
            />
            <span className="text-sm">Bio-zertifiziert</span>
          </label>
          <label className="flex items-center gap-2 mt-7">
            <input
              type="checkbox"
              checked={s.is_direct_trade}
              onChange={(e) => setS({ ...s, is_direct_trade: e.target.checked })}
            />
            <span className="text-sm">Direct Trade</span>
          </label>
        </div>
      </Section>

      {/* Allergene + Zertifikate */}
      <Section title="Allergene">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {allergens.map((a) => {
            const checked = s.allergen_slugs.includes(a.slug);
            return (
              <label
                key={a.slug}
                className={
                  "flex items-center gap-2 px-3 py-2 border cursor-pointer transition-colors " +
                  (checked
                    ? "border-rose-400 bg-rose-50 text-rose-900"
                    : "border-primary/10 hover:border-primary/30")
                }
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const set = new Set(s.allergen_slugs);
                    if (e.target.checked) set.add(a.slug);
                    else set.delete(a.slug);
                    setS({ ...s, allergen_slugs: Array.from(set) });
                  }}
                />
                <span className="text-sm">{a.label}</span>
              </label>
            );
          })}
        </div>
      </Section>

      <Section title="Zertifikate">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {certifications.map((c) => {
            const checked = s.certification_ids.includes(c.id);
            return (
              <label
                key={c.id}
                className={
                  "flex items-center gap-2 px-3 py-2 border cursor-pointer transition-colors " +
                  (checked
                    ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                    : "border-primary/10 hover:border-primary/30")
                }
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const set = new Set(s.certification_ids);
                    if (e.target.checked) set.add(c.id);
                    else set.delete(c.id);
                    setS({ ...s, certification_ids: Array.from(set) });
                  }}
                />
                <span className="text-sm">{c.label}</span>
              </label>
            );
          })}
        </div>
      </Section>

      {/* Validation-Summary */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="space-y-2">
          {errors.map((e, i) => (
            <div key={i} className="bg-rose-50 border-l-4 border-rose-400 p-3 text-sm">
              <strong className="font-headline text-[10px] uppercase tracking-widest font-bold text-rose-900 mr-2">
                Fehler
              </strong>
              {e.message}
            </div>
          ))}
          {warnings.map((w, i) => (
            <div key={i} className="bg-amber-50 border-l-4 border-amber-400 p-3 text-sm">
              <strong className="font-headline text-[10px] uppercase tracking-widest font-bold text-amber-900 mr-2">
                Warnung
              </strong>
              {w.message}
            </div>
          ))}
        </div>
      )}

      {serverError && (
        <div className="bg-rose-50 border-l-4 border-rose-400 p-3 text-sm text-rose-900">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-4 pt-4 border-t border-primary/10">
        <button
          type="submit"
          disabled={submitting || errors.length > 0}
          className="bg-primary text-on-primary px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
        >
          {submitting ? "Speichern..." : "Als Entwurf speichern"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-8 py-4 font-headline font-bold text-xs uppercase tracking-widest border border-primary/20 hover:bg-primary/5 transition-all"
        >
          Abbrechen
        </button>
      </div>
      <p className="text-xs text-on-surface-variant">
        Coffees werden als <strong>Entwurf</strong> gespeichert und müssen
        anschließend von einem Admin auf <strong>active</strong> gesetzt werden,
        bevor sie für Kunden sichtbar sind.
      </p>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          background-color: white;
          border: 1px solid rgb(0 0 0 / 0.1);
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          transition: border-color 150ms;
        }
        :global(.form-input:focus) {
          outline: none;
          border-color: rgb(180 83 9 / 0.6);
        }
      `}</style>
    </form>
  );
}

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-t border-primary/10 pt-6">
      <legend className="font-headline font-bold text-tertiary uppercase tracking-[0.3em] text-[11px] mb-1 -mt-9 bg-[#F9F5F0] px-2">
        {title}
      </legend>
      {sub && <p className="text-xs text-on-surface-variant mb-4 max-w-2xl">{sub}</p>}
      <div className="space-y-4 mt-4">{children}</div>
    </fieldset>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-2">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-on-surface-variant/70 mt-1">{hint}</p>}
    </div>
  );
}
