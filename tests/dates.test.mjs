import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarToday, parseDate, relationshipDuration, weddingCountdown, formatDate } from '../src/utils/dates.js';

test('rejeita datas impossíveis e placeholders, aceita ano bissexto', () => {
  for (const value of [null, '', 'YYYY-MM-DD', '2026-02-29', '2026-13-01']) assert.equal(parseDate(value), null);
  assert.ok(parseDate('2024-02-29'));
  assert.equal(formatDate(null), 'Data a preencher');
});
test('calcula tempo de relacionamento pelo calendário, incluindo fim de mês', () => {
  assert.deepEqual(relationshipDuration('2023-05-20', new Date('2026-10-06T15:00:00Z')), { years: 3, months: 4, days: 16, totalDays: 1235 });
  const leap = relationshipDuration('2024-02-29', new Date('2025-02-28T15:00:00Z'));
  assert.equal(leap.years, 1); assert.equal(leap.months, 0); assert.equal(leap.days, 0);
  const monthEnd = relationshipDuration('2026-01-31', new Date('2026-02-28T15:00:00Z'));
  assert.equal(monthEnd.months, 1); assert.equal(monthEnd.days, 0);
  assert.equal(relationshipDuration('2027-01-01', new Date('2026-10-06T15:00:00Z')), null);
});
test('usa a data de São Paulo mesmo quando UTC já está no dia seguinte', () => {
  assert.equal(calendarToday(new Date('2026-10-07T01:00:00Z')).toISOString(), '2026-10-06T00:00:00.000Z');
});
test('countdown vira em meia-noite de São Paulo e nunca produz números negativos', () => {
  assert.deepEqual(weddingCountdown('2027-07-24', new Date('2027-07-24T02:59:59Z')), { days: 0, hours: 0, minutes: 0, seconds: 1, reached: false, isToday: false });
  const today = weddingCountdown('2027-07-24', new Date('2027-07-24T03:00:00Z'));
  assert.equal(today.reached, true); assert.equal(today.isToday, true); assert.equal(today.seconds, 0);
  const later = weddingCountdown('2027-07-24', new Date('2027-08-10T15:00:00Z'));
  assert.equal(later.isToday, false); assert.equal(later.days, 0);
});
