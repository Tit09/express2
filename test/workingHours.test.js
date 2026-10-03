// Test simple de la logique d'horaires (aucune dépendance nécessaire).
// Lancer avec : npm test
const assert = require('assert');
const { getLocalTime, isOpen, nextOpening } = require('../middleware/workingHours');

const TZ = 'Africa/Dakar'; // UTC+0, sans heure d'été
const at = (iso) => getLocalTime(new Date(iso), TZ);

const cases = [
  ['lundi 08:59 : fermé',            '2026-10-05T08:59:00Z', false],
  ['lundi 09:00 : ouvert',           '2026-10-05T09:00:00Z', true],
  ['mercredi 12:30 : ouvert',        '2026-10-07T12:30:00Z', true],
  ['vendredi 16:59 : ouvert',        '2026-10-09T16:59:00Z', true],
  ['vendredi 17:00 : fermé',         '2026-10-09T17:00:00Z', false],
  ['samedi 10:00 : fermé',           '2026-10-10T10:00:00Z', false],
  ['dimanche 14:00 : fermé',         '2026-10-11T14:00:00Z', false],
];

cases.forEach(([name, iso, expected]) => {
  assert.strictEqual(isOpen(at(iso)), expected, name);
  console.log('OK  ', name);
});

assert.strictEqual(nextOpening(at('2026-10-05T07:00:00Z')), "aujourd'hui à 9h");
assert.strictEqual(nextOpening(at('2026-10-07T18:00:00Z')), 'demain à 9h');
assert.strictEqual(nextOpening(at('2026-10-09T18:00:00Z')), 'lundi à 9h');
assert.strictEqual(nextOpening(at('2026-10-10T10:00:00Z')), 'lundi à 9h');
console.log('OK   prochaine ouverture');

console.log('\nTous les tests passent.');
