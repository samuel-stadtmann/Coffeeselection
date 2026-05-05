#!/usr/bin/env node
/**
 * Coffee Selection — Klassifikator-Test (Schritt 9.6 / Playbook Kap. 4.9)
 *
 * Laedt alle aktiven Test-Profile aus public.test_quiz_profiles, ruft fuer
 * jedes simulate_classification() ueber Supabase-RPC auf und vergleicht
 * mit den Erwartungen.
 *
 * Exit-Codes:
 *   0 = alle Tests bestanden
 *   1 = mindestens ein Test fehlgeschlagen
 *
 * ENV-Variablen (.env oder Shell):
 *   SUPABASE_URL                 Projekt-URL (https://xxx.supabase.co)
 *   SUPABASE_SERVICE_ROLE_KEY    service_role-Key (NIE ins Frontend!)
 *
 * Aufruf:
 *   cd scripts && npm install && node test_classifier.js
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('FEHLER: SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY muessen gesetzt sein.');
  console.error('  Lege scripts/.env an (siehe .env.example) oder exportiere die Variablen.');
  process.exit(2);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TYPE_NAMES = {
  1: 'Klassiker',
  2: 'Fruchtfreund',
  3: 'Espresso-Enthusiast',
  4: 'Entdecker',
  5: 'Sanfte',
  6: 'Florale',
  7: 'Erdige',
  8: 'Suesse',
};

const COLORS = {
  reset:  '\x1b[0m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  bold:   '\x1b[1m',
};

function fmtTypeName(id) {
  return id ? `${id} (${TYPE_NAMES[id] || '?'})` : '?';
}

async function main() {
  console.log(`${COLORS.bold}Coffee Selection — Klassifikator-Test${COLORS.reset}`);
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  // 1) Test-Profile laden
  const { data: profiles, error: profilesErr } = await supabase
    .from('test_quiz_profiles')
    .select('profile_name, description, expected_type, expected_min_confidence, answers')
    .eq('is_active', true)
    .order('expected_type', { ascending: true });

  if (profilesErr) {
    console.error('FEHLER beim Laden der Test-Profile:', profilesErr.message);
    process.exit(2);
  }
  if (!profiles || profiles.length === 0) {
    console.error('FEHLER: keine aktiven Test-Profile gefunden.');
    process.exit(2);
  }

  console.log(`Gefundene Profile: ${profiles.length}\n`);

  let passed = 0;
  let failed = 0;
  const failures = [];

  // 2) Pro Profil simulieren und pruefen
  for (const profile of profiles) {
    const { data, error } = await supabase.rpc('simulate_classification', {
      p_answers: profile.answers,
    });

    if (error) {
      console.log(
        `${COLORS.red}FAIL${COLORS.reset}  ${profile.profile_name}\n` +
        `       RPC-Fehler: ${error.message}`
      );
      failed++;
      failures.push({ profile, reason: 'rpc_error', detail: error.message });
      continue;
    }

    // RPC-Funktionen die TABLE returnen liefern Array — erste Zeile lesen
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      console.log(`${COLORS.red}FAIL${COLORS.reset}  ${profile.profile_name}\n       Leeres Resultat`);
      failed++;
      failures.push({ profile, reason: 'empty_result' });
      continue;
    }

    const typeOk = row.primary_type_id === profile.expected_type;
    const confOk = Number(row.confidence) >= Number(profile.expected_min_confidence);
    const ok = typeOk && confOk;

    if (ok) {
      console.log(
        `${COLORS.green}PASS${COLORS.reset}  ${profile.profile_name}\n` +
        `       Typ: ${fmtTypeName(row.primary_type_id)}  ` +
        `Conf: ${Number(row.confidence).toFixed(3)}  ` +
        `Score: ${row.primary_score}/100  ` +
        `Coverage: ${Number(row.coverage).toFixed(2)}`
      );
      passed++;
    } else {
      const reasons = [];
      if (!typeOk) reasons.push(
        `Typ erwartet ${fmtTypeName(profile.expected_type)}, erhalten ${fmtTypeName(row.primary_type_id)}`
      );
      if (!confOk) reasons.push(
        `Confidence erwartet >= ${profile.expected_min_confidence}, erhalten ${Number(row.confidence).toFixed(3)}`
      );
      console.log(
        `${COLORS.red}FAIL${COLORS.reset}  ${profile.profile_name}\n` +
        `       ${reasons.join('\n       ')}\n` +
        `       Sekundaer: ${fmtTypeName(row.secondary_type_id)} ` +
        `(${row.secondary_score}/100)  ` +
        `Coverage: ${Number(row.coverage).toFixed(2)}`
      );
      failed++;
      failures.push({ profile, row, reasons });
    }
  }

  // 3) Zusammenfassung
  console.log(`\n${COLORS.bold}Zusammenfassung${COLORS.reset}`);
  console.log(`  ${COLORS.green}Passed:${COLORS.reset} ${passed}`);
  console.log(`  ${failed > 0 ? COLORS.red : ''}Failed:${COLORS.reset} ${failed}`);
  console.log(`  Total:  ${profiles.length}`);

  if (failed > 0) {
    console.log(`\n${COLORS.red}${COLORS.bold}TESTS FEHLGESCHLAGEN${COLORS.reset}`);
    console.log('Algorithmus NICHT deployen. Fix:');
    for (const f of failures) {
      console.log(`  - ${f.profile.profile_name}: ${f.reasons ? f.reasons.join('; ') : f.detail || f.reason}`);
    }
    process.exit(1);
  }

  console.log(`\n${COLORS.green}${COLORS.bold}ALLE TESTS OK${COLORS.reset}\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Unerwarteter Fehler:', err);
  process.exit(2);
});
