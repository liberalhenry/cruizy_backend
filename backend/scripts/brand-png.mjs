#!/usr/bin/env node
/** PNG-Fassungen der Logo-Dateien (E-Mail, Werkzeug). Aufruf: node backend/scripts/brand-png.mjs */
import sharp from 'sharp';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../../shared/brand');
const jobs = [
  // E-Mail-Kopf: doppelte Auflösung, angezeigt 36 px hoch
  ['cruizy-logo-hell.svg', 'cruizy-logo-hell-mail.png', { height: 72 }],
  ['cruizy-logo-dunkel.svg', 'cruizy-logo-dunkel-mail.png', { height: 72 }],
  ['cruizy-symbol.svg', 'cruizy-symbol-512.png', { width: 512, height: 512 }],
  ['cruizy-symbol.svg', 'cruizy-symbol-192.png', { width: 192, height: 192 }],
];
for (const [src, out, size] of jobs) {
  await sharp(resolve(dir, src), { density: 600 }).resize(size).png({ compressionLevel: 9 }).toFile(resolve(dir, out));
  console.log(out);
}
