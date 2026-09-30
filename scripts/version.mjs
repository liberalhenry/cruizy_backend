#!/usr/bin/env node
/**
 * Versionsnummer nach Semantic Versioning 2.0.0 (https://semver.org/lang/de/).
 *
 *   node scripts/version.mjs              → zeigt die Version
 *   node scripts/version.mjs patch        → 1.2.3 → 1.2.4   (nur Fehlerbehebungen)
 *   node scripts/version.mjs minor        → 1.2.3 → 1.3.0   (neue Funktionen, abwärtskompatibel)
 *   node scripts/version.mjs major        → 1.2.3 → 2.0.0   (inkompatible Änderungen)
 *   node scripts/version.mjs 1.4.0-rc.1   → genau diese Version
 *   node scripts/version.mjs --check      → VERSION, package.json und CHANGELOG.md stimmen überein
 *
 * Schreibt VERSION, backend/package.json, frontend/package.json und legt in CHANGELOG.md
 * einen Abschnitt an (aus „Unveröffentlicht“). Das Release entsteht beim Merge auf main
 * (.github/workflows/ci.yml): Tag vX.Y.Z und GitHub-Release mit dem Abschnitt als Text.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/;
const read = (f) => readFileSync(resolve(root, f), 'utf8');
const current = read('VERSION').trim();
const arg = process.argv[2];

function packages(version) {
  for (const dir of ['backend', 'frontend']) {
    for (const f of [`${dir}/package.json`, `${dir}/package-lock.json`]) {
      const j = JSON.parse(read(f));
      if (version) {
        j.version = version;
        if (j.packages?.['']) j.packages[''].version = version;
        writeFileSync(resolve(root, f), JSON.stringify(j, null, 2) + '\n');
      } else if (j.version !== current || (j.packages?.[''] && j.packages[''].version !== current)) {
        return `${f} hat ${j.version}, VERSION sagt ${current}`;
      }
    }
  }
  return null;
}

if (!arg) {
  console.log(current);
} else if (arg === '--check') {
  const problems = [];
  if (!SEMVER.test(current)) problems.push(`VERSION ist keine SemVer-Version: ${current}`);
  const p = packages(null);
  if (p) problems.push(p);
  if (!read('CHANGELOG.md').includes(`## [${current}]`)) problems.push(`CHANGELOG.md hat keinen Abschnitt „## [${current}]“`);
  if (problems.length) {
    console.error(problems.join('\n'));
    process.exit(1);
  }
  console.log(`Version ${current} stimmt überall.`);
} else {
  const m = SEMVER.exec(current);
  let next = arg;
  if (arg === 'major') next = `${+m[1] + 1}.0.0`;
  else if (arg === 'minor') next = `${m[1]}.${+m[2] + 1}.0`;
  else if (arg === 'patch') next = `${m[1]}.${m[2]}.${+m[3] + 1}`;
  if (!SEMVER.test(next)) throw new Error(`Keine gültige Version: ${next}`);
  writeFileSync(resolve(root, 'VERSION'), next + '\n');
  packages(next);
  const log = read('CHANGELOG.md');
  const today = new Date().toISOString().slice(0, 10);
  if (!log.includes(`## [${next}]`)) {
    writeFileSync(resolve(root, 'CHANGELOG.md'), log.replace('## [Unveröffentlicht]', `## [Unveröffentlicht]\n\n## [${next}] – ${today}`));
  }
  console.log(`${current} → ${next}. Jetzt CHANGELOG.md prüfen, committen, auf main mergen — das Release entsteht dann automatisch.`);
}
