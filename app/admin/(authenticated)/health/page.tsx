import type { Metadata } from "next";
import { getAdminUser, isAdminEmail } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";

export const metadata: Metadata = {
  title: "Admin · System Health — Coffee Selection",
  robots: { index: false, follow: false },
};

// Page bewusst dynamisch — Checks laufen frisch bei jedem Aufruf,
// nichts darf gecacht werden.
export const dynamic = "force-dynamic";
export const revalidate = 0;

type Check = {
  label: string;
  ok: boolean;
  detail: string;
  hint?: string;
};

async function envCheck(name: string, opts?: { minLen?: number }): Promise<Check> {
  const v = process.env[name];
  if (!v) {
    return {
      label: name,
      ok: false,
      detail: "fehlt",
      hint: "In Vercel → Settings → Environment Variables für Production+Preview+Development setzen, dann Redeploy.",
    };
  }
  if (opts?.minLen && v.length < opts.minLen) {
    return {
      label: name,
      ok: false,
      detail: `nur ${v.length} Zeichen, mindestens ${opts.minLen}`,
      hint: "Längeren Wert eintragen.",
    };
  }
  return { label: name, ok: true, detail: `${v.length} Zeichen gesetzt` };
}

async function supabaseRead(): Promise<Check> {
  try {
    const sb = createServiceClient();
    const { error } = await sb.from("coffees").select("id").limit(1);
    if (error) {
      return {
        label: "Supabase erreichbar (coffees)",
        ok: false,
        detail: error.message,
        hint: "URL+Service-Key prüfen, ggf. Supabase-Projekt pausiert?",
      };
    }
    return { label: "Supabase erreichbar (coffees)", ok: true, detail: "Read OK" };
  } catch (e) {
    return {
      label: "Supabase erreichbar (coffees)",
      ok: false,
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}

function deployInfo() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA;
  const branch = process.env.VERCEL_GIT_COMMIT_REF;
  const env = process.env.VERCEL_ENV;
  const region = process.env.VERCEL_REGION;
  return {
    sha: sha ? sha.slice(0, 7) : "local",
    fullSha: sha ?? "—",
    branch: branch ?? "—",
    env: env ?? "development",
    region: region ?? "—",
  };
}

async function supabaseEdgeFunctionsHint(): Promise<Check> {
  // OPENAI_API_KEY und Resend leben als Secrets auf Supabase-Seite
  // (Edge Functions). Hier auf Vercel sind sie NICHT noetig — der
  // alte Check hat das falsch geflaggt.
  return {
    label: "Embeddings + Mails (Supabase Edge Functions)",
    ok: true,
    detail:
      "Werden serverless auf Supabase ausgefuehrt mit eigenen Secrets (OPENAI_API_KEY_COFFEESELECTION, RESEND_API_KEY). Pruefung dieser Secrets im Supabase-Dashboard → Edge Functions → Manage Secrets, nicht hier.",
  };
}

export default async function AdminHealthPage() {
  // Wenn das Layout uns hier rein lässt, ist auth bereits ok — wir
  // wollen trotzdem den User für die Anzeige.
  const user = await getAdminUser();
  const deploy = deployInfo();

  const envChecks = await Promise.all([
    envCheck("NEXT_PUBLIC_SUPABASE_URL"),
    envCheck("NEXT_PUBLIC_SUPABASE_ANON_KEY", { minLen: 40 }),
    envCheck("SUPABASE_SERVICE_ROLE_KEY", { minLen: 40 }),
    envCheck("ADMIN_REAUTH_SECRET", { minLen: 16 }),
    envCheck("ADMIN_EMAILS"),
  ]);

  const services = await Promise.all([supabaseRead(), supabaseEdgeFunctionsHint()]);

  const adminEmailsRaw = process.env.ADMIN_EMAILS ?? "";
  const adminEmails = adminEmailsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const currentUserIsAdmin = user ? isAdminEmail(user.email) : false;

  const allChecks: Check[] = [
    ...envChecks,
    ...services,
    {
      label: "Aktueller User ist Admin",
      ok: currentUserIsAdmin,
      detail: user ? `${user.email} ${currentUserIsAdmin ? "✓ in ADMIN_EMAILS" : "NICHT in ADMIN_EMAILS"}` : "nicht eingeloggt",
      hint: !currentUserIsAdmin && user
        ? `E-Mail ${user.email} zur ADMIN_EMAILS-Env-Variable (komma-getrennt) hinzufügen, dann Redeploy.`
        : undefined,
    },
  ];

  const failing = allChecks.filter((c) => !c.ok);
  const overall = failing.length === 0;

  return (
    <>
      <div className="mb-8">
        <span className="font-headline font-bold text-tertiary uppercase tracking-[0.4em] text-[11px] mb-4 block">
          Diagnose · Staging-Stabilität
        </span>
        <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
          System Health
        </h1>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          Live-Check aller Env-Variablen und externen Dienste. Wenn hier alles
          grün ist, ist das Admin-Setup funktional. Bei Rot → Hint folgen.
        </p>
      </div>

      <div
        className={
          "p-6 mb-8 border-l-4 " +
          (overall
            ? "bg-emerald-50 border-emerald-400 text-emerald-900"
            : "bg-rose-50 border-rose-400 text-rose-900")
        }
      >
        <p className="font-headline font-bold text-lg mb-1">
          {overall ? "✓ Alle Checks grün" : `✗ ${failing.length} Check${failing.length === 1 ? "" : "s"} schlagen fehl`}
        </p>
        <p className="text-sm">
          {overall
            ? "Staging ist betriebsbereit für Admin-Tasks."
            : "Siehe Hints unten — meistens fehlende oder falsch eingetragene Env-Variable."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
        <div className="bg-white shadow-sm p-6">
          <h2 className="font-headline text-[11px] uppercase tracking-widest font-bold text-tertiary mb-4">
            Deploy-Info
          </h2>
          <dl className="text-sm space-y-1.5">
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Environment</dt>
              <dd className="font-mono font-bold">{deploy.env}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Branch</dt>
              <dd className="font-mono font-bold">{deploy.branch}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Commit</dt>
              <dd className="font-mono font-bold" title={deploy.fullSha}>{deploy.sha}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Region</dt>
              <dd className="font-mono">{deploy.region}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-on-surface-variant">Geprüft am</dt>
              <dd className="font-mono">{new Date().toLocaleString("de-CH")}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow-sm p-6">
          <h2 className="font-headline text-[11px] uppercase tracking-widest font-bold text-tertiary mb-4">
            Admin-Whitelist
          </h2>
          {adminEmails.length === 0 ? (
            <p className="text-sm text-rose-900">ADMIN_EMAILS leer — niemand kann auf Admin zugreifen.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {adminEmails.map((e) => (
                <li key={e} className="font-mono">
                  {user?.email?.toLowerCase() === e.toLowerCase() ? "▶ " : "  "}
                  {e}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left font-headline text-[10px] uppercase tracking-widest text-tertiary border-b border-primary/10 bg-surface-container-low">
            <tr>
              <th className="px-4 py-3 font-bold w-16">Status</th>
              <th className="px-4 py-3 font-bold">Check</th>
              <th className="px-4 py-3 font-bold">Details</th>
            </tr>
          </thead>
          <tbody>
            {allChecks.map((c) => (
              <tr key={c.label} className="border-b border-primary/5 align-top">
                <td className="px-4 py-3">
                  <span
                    className={
                      "font-headline text-[10px] uppercase tracking-widest font-bold px-2 py-1 " +
                      (c.ok ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-900")
                    }
                  >
                    {c.ok ? "OK" : "FAIL"}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono">{c.label}</td>
                <td className="px-4 py-3">
                  <div>{c.detail}</div>
                  {c.hint && !c.ok && (
                    <div className="text-xs text-on-surface-variant mt-1 italic">→ {c.hint}</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-on-surface-variant mt-8">
        Diese Seite ist live: jeder Page-Reload führt die Checks erneut aus.
        Bei rot eine Env-Variable: in Vercel → Settings → Environment Variables
        anpassen, dann <strong>Redeploy</strong> (Env-Änderungen ohne Redeploy
        wirken nicht).
      </p>
    </>
  );
}
