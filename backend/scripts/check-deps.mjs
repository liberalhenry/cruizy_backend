#!/usr/bin/env node
/**
 * AK-Q08-01: keine Analyse-, Werbe- oder Fehler-SDKs Dritter — weder direkt noch
 * als Unterabhängigkeit. Prüft die Sperrdateien von Backend und Frontend.
 *   node scripts/check-deps.mjs [pfad/zu/package-lock.json ...]
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const FORBIDDEN = [
  /^@sentry\//, /^sentry/, /^@bugsnag\//, /^bugsnag/, /^newrelic$/, /^@newrelic\//, /^dd-trace$/, /^@datadog\//,
  /^firebase/, /^@firebase\//, /^@google-analytics\//, /^react-ga/, /^ga-4-react/, /^universal-analytics$/,
  /^mixpanel/, /^@segment\//, /^analytics-node$/, /^@amplitude\//, /^amplitude-js$/, /^posthog/, /^hotjar/, /^@hotjar\//,
  /^react-facebook-pixel$/, /^facebook-nodejs-business-sdk$/, /^@vercel\/analytics$/, /^logrocket/, /^@fullstory\//,
  /^onesignal/, /^@onesignal\//, /^@braze\//, /^appsflyer/, /^@adjust\//, /^branch-sdk$/, /^intercom/, /^@intercom\//,
];

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [resolve(here, '../package-lock.json'), resolve(here, '../../frontend/package-lock.json')];

let bad = [];
for (const f of files) {
  if (!existsSync(f)) continue;
  const lock = JSON.parse(readFileSync(f, 'utf8'));
  for (const key of Object.keys(lock.packages ?? {})) {
    const name = key.replace(/^.*node_modules\//, '');
    if (!name) continue;
    if (FORBIDDEN.some((re) => re.test(name))) bad.push(`${f}: ${name}`);
  }
}
if (bad.length) {
  console.error('Unzulässige Abhängigkeiten (AK-Q08-01):\n  ' + bad.join('\n  '));
  process.exit(1);
}
console.log('Abhängigkeiten geprüft: keine Analyse-, Werbe- oder Fehler-SDKs Dritter.');
