"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  AROMA_FAMILIES,
  type AromaFamily,
  type CoffeeFormState,
  ROAST_LEVELS,
  SENSORY_AXES,
  computeQualityScorePreview,
  slugify,
  tenToFive,
  validateCoffee,
} from "@/lib/coffee/form-helpers";

export type LookupOption = { id: string; label: string };

type Props = {
  initial: CoffeeFormState;
  roasters: LookupOption[];
  origins: LookupOption[];
  varieties: LookupOption[];
  processings: LookupOption[];
  allergens: Array<{ slug: string; label: string }>;
  certifications: LookupOption[];
  submitEndpoint: string;
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
  const [active, setActive] = useState<string>("identity");

  function onNameChange(v: string) {
    setS((prev) => ({ ...prev, name: v, slug: prev.slug || slugify(v) }));
  }

  const issues = useMemo(() => validateCoffee(s), [s]);
  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warn");
  const score = useMemo(() => computeQualityScorePreview(s), [s]);

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

  // Section-Status für die linke Nav: Wenn ein Pflichtfeld in der Section
  // noch fehlt, zeigen wir einen roten Dot.
  const sectionErrors: Record<string, number> = {
    identity: errors.filter((e) => ["name", "slug", "roaster_id"].includes(e.field)).length,
    description: errors.filter((e) => e.field === "flavor_description").length,
    sensory: errors.filter((e) => SENSORY_AXES.some((ax) => ax.key === e.field)).length,
    aroma: errors.filter((e) => e.field === "aroma_families").length,
    roast: 0,
    origin: errors.filter((e) => e.field === "altitude_m_max").length,
    commerce: errors.filter((e) => ["price_chf", "weight_g"].includes(e.field)).length,
    allergens: 0,
    certifications: 0,
  };

  const NAV: Array<{ id: string; label: string; required?: boolean }> = [
    { id: "identity", label: "Stammdaten", required: true },
    { id: "description", label: "Geschmack", required: true },
    { id: "sensory", label: "Sensorik", required: true },
    { id: "aroma", label: "Aromen" },
    { id: "roast", label: "Röstung" },
    { id: "origin", label: "Herkunft" },
    { id: "commerce", label: "Kommerz", required: true },
    { id: "allergens", label: "Allergene" },
    { id: "certifications", label: "Zertifikate" },
  ];

  return (
    <form onSubmit={onSubmit} className="relative">
      {/* Layout: Links sticky Nav, rechts Inhalt */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 pb-32">
        {/* Sticky Section-Nav (Desktop) */}
        <aside className="hidden lg:block">
          <nav className="sticky top-32 space-y-1">
            <p className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-3">
              Abschnitte
            </p>
            {NAV.map((n) => {
              const isActive = active === n.id;
              const errCount = sectionErrors[n.id] ?? 0;
              return (
                <a
                  key={n.id}
                  href={`#section-${n.id}`}
                  onClick={() => setActive(n.id)}
                  className={
                    "flex items-center justify-between gap-2 px-3 py-2 text-sm transition-colors border-l-2 " +
                    (isActive
                      ? "border-tertiary text-primary bg-white"
                      : "border-transparent text-on-surface-variant hover:text-primary hover:bg-white/50")
                  }
                >
                  <span className="flex items-center gap-2">
                    {n.label}
                    {n.required && <span className="text-tertiary text-[10px]">*</span>}
                  </span>
                  {errCount > 0 && (
                    <span className="w-2 h-2 bg-rose-500 rounded-full" title={`${errCount} Fehler`} />
                  )}
                </a>
              );
            })}
            <div className="pt-4 mt-4 border-t border-primary/10">
              <ScoreBox score={score} />
              <Status label="Pflichtfelder" value={errors.length === 0 ? "OK" : `${errors.length} offen`} variant={errors.length === 0 ? "ok" : "alert"} />
              <Status label="Warnungen" value={warnings.length === 0 ? "—" : `${warnings.length}`} variant={warnings.length === 0 ? "ok" : "warn"} />
            </div>
          </nav>
        </aside>

        <div className="space-y-6 max-w-3xl">
          {/* IDENTITY */}
          <Card id="identity" title="Stammdaten" hint="Name, URL-Slug und Röster.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Box label="Name *">
                <input type="text" value={s.name} onChange={(e) => onNameChange(e.target.value)} required className="form-input" placeholder="z.B. Yirgacheffe Reko Washed" />
              </Box>
              <Box label="Röster *">
                <select value={s.roaster_id} onChange={(e) => setS({ ...s, roaster_id: e.target.value })} required className="form-input">
                  <option value="">— auswählen —</option>
                  {roasters.map((r) => (<option key={r.id} value={r.id}>{r.label}</option>))}
                </select>
              </Box>
            </div>
            <Box
              label="Slug *"
              hint="Wird Teil der URL: coffeeselection.ch/coffee/<slug>. Nur Kleinbuchstaben, Zahlen, Bindestriche. Auto-generiert aus dem Namen, überschreibbar."
            >
              <input
                type="text"
                value={s.slug}
                onChange={(e) => setS({ ...s, slug: e.target.value })}
                required
                className="form-input font-mono text-sm"
                placeholder="z.B. yirgacheffe-reko-washed"
              />
            </Box>
            <Box label="Kurz-Pitch" hint="Ein Satz für die Listen-Ansicht. Max 200 Zeichen.">
              <input type="text" value={s.short_description} onChange={(e) => setS({ ...s, short_description: e.target.value })} maxLength={500} className="form-input" />
            </Box>
            <Box label="Beschreibung" hint="Markdown ok. Erscheint auf der Coffee-Detail-Seite.">
              <textarea value={s.description} onChange={(e) => setS({ ...s, description: e.target.value })} rows={3} className="form-input" />
            </Box>
          </Card>

          {/* DESCRIPTION (Geschmack-Texte fuer Algorithmus) */}
          <Card id="description" title="Geschmacks-Beschreibung" hint="Diese Texte gehen direkt ins OpenAI-Embedding. Je präziser, desto besser matched der Algorithmus.">
            <Box label="Flavor-Description *" hint="Aromen, Mundgefühl, Abgang. Beispiel: „Bergamotte, weißer Pfirsich, Jasmin, Tee-artiger Körper, langer süßer Abgang.“">
              <textarea value={s.flavor_description} onChange={(e) => setS({ ...s, flavor_description: e.target.value })} rows={3} className="form-input" />
            </Box>
            <Box label="Tasting-Summary" hint="Ein Satz für die UI (Coffee-Karten, Match-Result).">
              <input type="text" value={s.tasting_summary} onChange={(e) => setS({ ...s, tasting_summary: e.target.value })} className="form-input" />
            </Box>
          </Card>

          {/* SENSORY — Grid of 5 cards 1-10 */}
          <Card
            id="sensory"
            title="Sensorik (Cupping-Skala 1–10)"
            hint="Branchenübliche 10-Punkt-Skala. Wird intern auf SCA 1–5 normalisiert (1+2→1, 3+4→2, 5+6→3, 7+8→4, 9+10→5)."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SENSORY_AXES.map((ax) => {
                const v = s[ax.key];
                const sca = tenToFive(v);
                return (
                  <div key={ax.key} className="bg-surface-container-low/50 p-4 border border-primary/5">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
                        {ax.label}
                      </span>
                      <span className="text-[10px] text-on-surface-variant">SCA {sca}/5</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        step={1}
                        value={v}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) => {
                          const raw = e.target.value;
                          // Leerer Wert beim Loeschen erlauben — sonst kann man die "1" nicht weghauen.
                          if (raw === "") {
                            setS({ ...s, [ax.key]: 1 } as CoffeeFormState);
                            return;
                          }
                          const n = Number(raw);
                          const clamped = Number.isFinite(n) ? Math.max(1, Math.min(10, Math.round(n))) : 6;
                          setS({ ...s, [ax.key]: clamped } as CoffeeFormState);
                        }}
                        className="form-input w-20 text-2xl font-bold text-center"
                      />
                      <div className="flex-1">
                        <div className="h-2 bg-primary/10 rounded">
                          <div className="h-full bg-tertiary rounded transition-all" style={{ width: `${(v / 10) * 100}%` }} />
                        </div>
                        <div className="flex justify-between text-[9px] text-on-surface-variant/60 mt-1">
                          <span>1</span><span>5</span><span>10</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-on-surface-variant/70 mt-2 leading-snug">
                      {ax.hint1} · {ax.hint10}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* AROMA */}
          <Card id="aroma" title="Aroma-Familien" hint="Multi-Select. Nur was wirklich dominant ist — beeinflusst direkt das Matching.">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {AROMA_FAMILIES.map((af) => {
                const checked = s.aroma_families.includes(af.slug);
                return (
                  <button
                    type="button"
                    key={af.slug}
                    onClick={() => {
                      const set = new Set(s.aroma_families);
                      if (checked) set.delete(af.slug); else set.add(af.slug);
                      setS({ ...s, aroma_families: Array.from(set) as AromaFamily[] });
                    }}
                    className={
                      "text-left px-3 py-2 border text-sm transition-colors " +
                      (checked ? "border-tertiary bg-tertiary/10 text-primary font-bold" : "border-primary/10 bg-white hover:border-primary/30")
                    }
                  >
                    {af.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* ROAST */}
          <Card id="roast" title="Röstung">
            <Box label="Röstgrad" hint={`Aktuell: ${ROAST_LEVELS[s.roast_level - 1]?.label ?? "—"}`}>
              <div className="grid grid-cols-5 gap-2">
                {ROAST_LEVELS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setS({ ...s, roast_level: r.value })}
                    className={
                      "px-2 py-3 text-xs border transition-colors " +
                      (s.roast_level === r.value
                        ? "border-tertiary bg-tertiary/10 text-primary font-bold"
                        : "border-primary/10 bg-white hover:border-primary/30")
                    }
                    title={r.hint}
                  >
                    <div className="font-headline text-[10px] uppercase tracking-widest font-bold">{r.value}</div>
                    <div className="text-[11px] mt-1">{r.label}</div>
                  </button>
                ))}
              </div>
            </Box>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Box label="Röst-Profil">
                <select value={s.roast_profile} onChange={(e) => setS({ ...s, roast_profile: e.target.value as CoffeeFormState["roast_profile"] })} className="form-input">
                  <option value="omni">Omni (universal)</option>
                  <option value="filter">Filter</option>
                  <option value="espresso">Espresso</option>
                </select>
              </Box>
              <Box label="Frisch on-demand?" hint="z.B. Bündner Bohne röstet nach Bestellung.">
                <Toggle checked={s.is_fresh_roast_on_demand} onChange={(v) => setS({ ...s, is_fresh_roast_on_demand: v })} label="Wird auf Bestellung geröstet" />
              </Box>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Box label="Decaf?">
                <Toggle checked={s.is_decaf} onChange={(v) => setS({ ...s, is_decaf: v })} label="Entkoffeiniert" />
              </Box>
              {s.is_decaf && (
                <Box label="Decaf-Methode">
                  <select value={s.decaf_method} onChange={(e) => setS({ ...s, decaf_method: e.target.value as CoffeeFormState["decaf_method"] })} className="form-input">
                    <option value="">— wählen —</option>
                    <option value="swiss_water">Swiss Water</option>
                    <option value="co2">CO₂</option>
                    <option value="sugarcane_ea">Sugarcane EA</option>
                    <option value="solvent_ea">Solvent EA</option>
                    <option value="other">Andere</option>
                  </select>
                </Box>
              )}
            </div>
          </Card>

          {/* ORIGIN */}
          <Card id="origin" title="Herkunft" hint="Optional aber wichtig für Specialty-Positionierung.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Box label="Land">
                <select value={s.origin_id ?? ""} onChange={(e) => setS({ ...s, origin_id: e.target.value || null })} className="form-input">
                  <option value="">— optional —</option>
                  {origins.map((o) => (<option key={o.id} value={o.id}>{o.label}</option>))}
                </select>
              </Box>
              <Box label="Region">
                <input type="text" value={s.region} onChange={(e) => setS({ ...s, region: e.target.value })} className="form-input" placeholder="z.B. Yirgacheffe" />
              </Box>
              <Box label="Farm">
                <input type="text" value={s.farm} onChange={(e) => setS({ ...s, farm: e.target.value })} className="form-input" />
              </Box>
              <Box label="Producer">
                <input type="text" value={s.producer} onChange={(e) => setS({ ...s, producer: e.target.value })} className="form-input" />
              </Box>
              <Box label="Varietät">
                <select value={s.variety_id ?? ""} onChange={(e) => setS({ ...s, variety_id: e.target.value || null })} className="form-input">
                  <option value="">— optional —</option>
                  {varieties.map((v) => (<option key={v.id} value={v.id}>{v.label}</option>))}
                </select>
              </Box>
              <Box label="Processing">
                <select value={s.processing_method_id ?? ""} onChange={(e) => setS({ ...s, processing_method_id: e.target.value || null })} className="form-input">
                  <option value="">— optional —</option>
                  {processings.map((p) => (<option key={p.id} value={p.id}>{p.label}</option>))}
                </select>
              </Box>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Box label="Höhe Min (m)">
                <input type="number" min={0} max={4000} value={s.altitude_m_min ?? ""} onChange={(e) => setS({ ...s, altitude_m_min: e.target.value ? Number(e.target.value) : null })} className="form-input" />
              </Box>
              <Box label="Höhe Max (m)">
                <input type="number" min={0} max={4000} value={s.altitude_m_max ?? ""} onChange={(e) => setS({ ...s, altitude_m_max: e.target.value ? Number(e.target.value) : null })} className="form-input" />
              </Box>
              <Box label="Ernte-Jahr">
                <input type="number" min={1900} max={2100} value={s.harvest_year ?? ""} onChange={(e) => setS({ ...s, harvest_year: e.target.value ? Number(e.target.value) : null })} className="form-input" />
              </Box>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Box label="Lot-Number"><input type="text" value={s.lot_number} onChange={(e) => setS({ ...s, lot_number: e.target.value })} className="form-input" /></Box>
              <Box label="SCA-Score (0-100)"><input type="number" min={0} max={100} value={s.sca_score ?? ""} onChange={(e) => setS({ ...s, sca_score: e.target.value ? Number(e.target.value) : null })} className="form-input" /></Box>
            </div>
          </Card>

          {/* COMMERCE */}
          <Card id="commerce" title="Kommerz / Sortiment">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Box
                label="Verkaufspreis CHF *"
                hint="Was der Endkunde im Shop zahlt (inkl. Marge, inkl. MwSt)."
              >
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={s.price_chf ?? ""}
                  onChange={(e) => setS({ ...s, price_chf: e.target.value ? Number(e.target.value) : null })}
                  required
                  className="form-input"
                  placeholder="z.B. 24.90"
                />
              </Box>
              <Box
                label="Einkaufspreis CHF"
                hint="Was Coffee Selection an dich/den Röster zahlt (Wholesale, vertraulich — nicht im Shop sichtbar)."
              >
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={s.wholesale_price_chf ?? ""}
                  onChange={(e) => setS({ ...s, wholesale_price_chf: e.target.value ? Number(e.target.value) : null })}
                  className="form-input"
                  placeholder="z.B. 14.50"
                />
              </Box>
              <Box label="Gewicht (g) *">
                <input type="number" min={1} value={s.weight_g} onChange={(e) => setS({ ...s, weight_g: Number(e.target.value) })} required className="form-input" />
              </Box>
              <Box label="Stock-Status">
                <select value={s.stock_status} onChange={(e) => setS({ ...s, stock_status: e.target.value as CoffeeFormState["stock_status"] })} className="form-input">
                  <option value="in_stock">Verfügbar</option>
                  <option value="low_stock">Geringer Bestand</option>
                  <option value="out_of_stock">Nicht verfügbar</option>
                  <option value="discontinued">Discontinued</option>
                </select>
              </Box>
              <Box label="Stock (kg)" hint="< 0.25 → vom Algorithmus rausgefiltert.">
                <input type="number" step="0.1" min={0} value={s.stock_kg ?? ""} onChange={(e) => setS({ ...s, stock_kg: e.target.value ? Number(e.target.value) : null })} className="form-input" />
              </Box>
              <Box label="Min. Bestellmenge">
                <input type="number" min={1} value={s.min_order_qty} onChange={(e) => setS({ ...s, min_order_qty: Number(e.target.value) })} className="form-input" />
              </Box>
              <div className="grid grid-cols-1 gap-2">
                <Toggle checked={s.is_organic} onChange={(v) => setS({ ...s, is_organic: v })} label="Bio-zertifiziert" />
                <Toggle checked={s.is_direct_trade} onChange={(v) => setS({ ...s, is_direct_trade: v })} label="Direct Trade" />
              </div>
            </div>
          </Card>

          {/* ALLERGENS */}
          <Card id="allergens" title="Allergene">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {allergens.map((a) => {
                const checked = s.allergen_slugs.includes(a.slug);
                return (
                  <button
                    type="button"
                    key={a.slug}
                    onClick={() => {
                      const set = new Set(s.allergen_slugs);
                      if (checked) set.delete(a.slug); else set.add(a.slug);
                      setS({ ...s, allergen_slugs: Array.from(set) });
                    }}
                    className={
                      "text-left px-3 py-2 border text-sm transition-colors " +
                      (checked ? "border-rose-400 bg-rose-50 text-rose-900 font-bold" : "border-primary/10 bg-white hover:border-primary/30")
                    }
                  >
                    {a.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* CERTIFICATIONS */}
          <Card id="certifications" title="Zertifikate">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {certifications.map((c) => {
                const checked = s.certification_ids.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => {
                      const set = new Set(s.certification_ids);
                      if (checked) set.delete(c.id); else set.add(c.id);
                      setS({ ...s, certification_ids: Array.from(set) });
                    }}
                    className={
                      "text-left px-3 py-2 border text-sm transition-colors " +
                      (checked ? "border-emerald-400 bg-emerald-50 text-emerald-900 font-bold" : "border-primary/10 bg-white hover:border-primary/30")
                    }
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Validation-Summary */}
          {(errors.length > 0 || warnings.length > 0) && (
            <div className="space-y-2">
              {errors.map((e, i) => (
                <div key={`e${i}`} className="bg-rose-50 border-l-4 border-rose-400 p-3 text-sm">
                  <strong className="font-headline text-[10px] uppercase tracking-widest font-bold text-rose-900 mr-2">Fehler</strong>
                  {e.message}
                </div>
              ))}
              {warnings.map((w, i) => (
                <div key={`w${i}`} className="bg-amber-50 border-l-4 border-amber-400 p-3 text-sm">
                  <strong className="font-headline text-[10px] uppercase tracking-widest font-bold text-amber-900 mr-2">Warnung</strong>
                  {w.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Action-Bar unten */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary/10 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 flex items-center justify-between gap-4">
          <div className="text-xs text-on-surface-variant">
            {serverError && <span className="text-rose-700">{serverError}</span>}
            {!serverError && errors.length === 0 && warnings.length === 0 && (
              <span>Alle Pflichtfelder ausgefüllt — bereit zum Speichern als Entwurf.</span>
            )}
            {!serverError && errors.length > 0 && (
              <span className="text-rose-700">{errors.length} Pflichtfeld{errors.length === 1 ? "" : "er"} fehlt noch.</span>
            )}
            {!serverError && errors.length === 0 && warnings.length > 0 && (
              <span className="text-amber-900">{warnings.length} Warnung{warnings.length === 1 ? "" : "en"} — Speichern fragt nach.</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-3 font-headline font-bold text-[11px] uppercase tracking-widest border border-primary/20 hover:bg-primary/5"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={submitting || errors.length > 0}
              className="bg-primary text-on-primary px-6 py-3 font-headline font-bold text-[11px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
            >
              {submitting ? "Speichern..." : "Als Entwurf speichern"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        :global(.form-input) {
          width: 100%;
          background-color: white;
          border: 1px solid rgb(0 0 0 / 0.1);
          padding: 0.625rem 0.875rem;
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

function Card({
  id,
  title,
  hint,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`section-${id}`} className="bg-white shadow-sm border border-primary/5 p-5 md:p-6 scroll-mt-32">
      <header className="mb-4">
        <h2 className="font-headline text-xs uppercase tracking-[0.2em] text-primary font-bold">
          {title}
        </h2>
        {hint && <p className="text-xs text-on-surface-variant mt-1 max-w-2xl">{hint}</p>}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Box({
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
      <label className="block font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-on-surface-variant/70 mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none px-3 py-2 border border-primary/10 hover:border-primary/30 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4"
      />
      <span className="text-sm">{label}</span>
    </label>
  );
}

function ScoreBox({ score }: { score: ReturnType<typeof computeQualityScorePreview> }) {
  const pct = Math.round((score.total / score.max) * 100);
  const variant = pct >= 75 ? "ok" : pct >= 50 ? "warn" : "alert";
  const barCls = variant === "ok" ? "bg-emerald-500" : variant === "warn" ? "bg-amber-500" : "bg-rose-500";
  const textCls = variant === "ok" ? "text-emerald-700" : variant === "warn" ? "text-amber-700" : "text-rose-700";
  return (
    <details className="mb-3">
      <summary className="cursor-pointer list-none">
        <div className="flex justify-between items-baseline">
          <span className="text-[11px] text-on-surface-variant">Quality-Score</span>
          <span className={"font-bold text-lg " + textCls}>{score.total}/100</span>
        </div>
        <div className="h-1.5 bg-primary/10 mt-1">
          <div className={"h-full " + barCls} style={{ width: `${pct}%` }} />
        </div>
        <p className="text-[10px] text-on-surface-variant/60 mt-1">
          Vorschau · Ziel ≥ 75 für Freigabe · klicken für Details
        </p>
      </summary>
      <div className="mt-3 space-y-3 text-[11px]">
        {score.groups.map((g) => (
          <div key={g.label}>
            <div className="flex justify-between font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">
              <span>{g.label}</span>
              <span>{g.earned}/{g.max}</span>
            </div>
            <ul className="mt-1 space-y-0.5">
              {g.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className={it.earned > 0 ? "text-emerald-700" : "text-on-surface-variant/70"}>
                    {it.earned > 0 ? "✓" : "○"} {it.label}
                    {it.reason && (
                      <span className="block text-[9px] text-on-surface-variant/60 ml-3">
                        {it.reason}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-on-surface-variant/60">{it.earned}/{it.max}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

function Status({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant: "ok" | "warn" | "alert";
}) {
  const cls = variant === "ok"
    ? "text-emerald-700"
    : variant === "warn"
      ? "text-amber-700"
      : "text-rose-700";
  return (
    <div className="flex justify-between text-[11px] py-1">
      <span className="text-on-surface-variant">{label}</span>
      <span className={"font-bold " + cls}>{value}</span>
    </div>
  );
}
