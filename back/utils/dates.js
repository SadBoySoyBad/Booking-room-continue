const { fail } = require('./http');
const bangkokDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(date);
const dayBounds = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw fail(400, 'Invalid date. Use YYYY-MM-DD.');
  const start = new Date(`${value}T00:00:00+07:00`);
  if (!Number.isFinite(start.getTime()) || bangkokDate(start) !== value) throw fail(400, 'Invalid date.');
  return { start, end: new Date(start.getTime() + 86400000) };
};
const isTimezoneDateTime = (value) => {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d{2}-\d{2})T([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  // Date.parse silently rolls February 30 into March. Validate the calendar day
  // independently of the timezone offset before storing the instant.
  try { dayBounds(match[1]); return true; } catch { return false; }
};
module.exports = { bangkokDate, dayBounds, isTimezoneDateTime };
