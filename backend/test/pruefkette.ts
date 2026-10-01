/**
 * Prüfkette in den Tests: ein Abgleich gegen eine Testliste und ein Klassifikator, der alles
 * freigibt — außer CLASSIFIER=queue ist gesetzt (dann geht jedes Bild an einen Menschen).
 * Ersetzt die früheren Attrappen (HASH_PROVIDER=mock, CLASSIFIER=mock-allow), die es im Programm nicht mehr gibt.
 */
import { setClassifier, setHashMatcher } from '../src/providers/checks.js';

export const testHashList = new Set<string>();

export function installTestChecks() {
  setHashMatcher({
    name: 'test',
    async check(input) {
      return testHashList.has(input.hash) ? { hit: true, list: 'Testliste' } : { hit: false };
    },
  });
  setClassifier(async () => (process.env.CLASSIFIER === 'queue' ? null : 0));
}
