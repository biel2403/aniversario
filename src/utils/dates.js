export const TIME_ZONE = 'America/Sao_Paulo';
const DAY = 86_400_000;

export function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function calendarToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (key) => parts.find((part) => part.type === key).value;
  return parseDate(`${get('year')}-${get('month')}-${get('day')}`);
}

export function formatDate(value, options = {}) {
  const date = parseDate(value);
  return date ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'long', year: 'numeric', ...options }).format(date) : 'Data a preencher';
}

function addMonthsClamped(date, months) {
  const first = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  first.setUTCDate(Math.min(date.getUTCDate(), lastDay));
  return first;
}

export function relationshipDuration(value, now = new Date()) {
  const start = parseDate(value);
  const today = calendarToday(now);
  if (!start || start > today) return null;
  let months = (today.getUTCFullYear() - start.getUTCFullYear()) * 12 + today.getUTCMonth() - start.getUTCMonth();
  if (addMonthsClamped(start, months) > today) months -= 1;
  const days = Math.round((today - addMonthsClamped(start, months)) / DAY);
  return { years: Math.floor(months / 12), months: months % 12, days, totalDays: Math.round((today - start) / DAY) };
}

export function weddingCountdown(value, now = new Date()) {
  if (!parseDate(value)) return null;
  // The date is midnight in São Paulo, never midnight in the visitor's timezone.
  const target = new Date(`${value}T00:00:00-03:00`).getTime();
  const seconds = Math.max(0, Math.floor((target - now.getTime()) / 1000));
  return { days: Math.floor(seconds / 86400), hours: Math.floor(seconds / 3600) % 24, minutes: Math.floor(seconds / 60) % 60, seconds: seconds % 60, reached: now.getTime() >= target, isToday: calendarToday(now).getTime() === parseDate(value).getTime() };
}

export const pad = (number) => String(number).padStart(2, '0');
export function trackTime(ms = 0) {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
}
