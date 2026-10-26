const dateFmt = new Intl.DateTimeFormat('en-PH', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

const dateLongFmt = new Intl.DateTimeFormat('en-PH', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const timeFmt = new Intl.DateTimeFormat('en-PH', {
  hour: 'numeric',
  minute: '2-digit',
});

const monthFmt = new Intl.DateTimeFormat('en-PH', { month: 'short' });
const weekdayFmt = new Intl.DateTimeFormat('en-PH', { weekday: 'short' });
const dayFmt = new Intl.DateTimeFormat('en-PH', { day: '2-digit' });

export function toDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value) {
  const date = toDate(value);
  return date ? dateFmt.format(date) : 'Date TBD';
}

export function formatLongDate(value = new Date()) {
  const date = toDate(value) ?? new Date();
  return dateLongFmt.format(date);
}

export function formatTime(value) {
  const date = toDate(value);
  return date ? timeFmt.format(date) : 'Time TBD';
}

export function formatDateTime(value) {
  const date = toDate(value);
  if (!date) return 'Not scheduled';
  return `${dateFmt.format(date)} · ${timeFmt.format(date)}`;
}

export function dayBadge(value) {
  const date = toDate(value);
  if (!date) return { weekday: 'TBD', day: '--', month: '---' };
  return {
    weekday: weekdayFmt.format(date).toUpperCase(),
    day: dayFmt.format(date),
    month: monthFmt.format(date).toUpperCase(),
  };
}

export function withRoundTotals(matches = []) {
  const totals = {};
  for (const match of matches) {
    if (match.format !== 'single_elimination') continue;
    totals[match.sport_id] = Math.max(totals[match.sport_id] || 1, Number(match.round) || 1);
  }
  return matches.map((match) => ({
    ...match,
    total_rounds:
      match.format === 'single_elimination' ? totals[match.sport_id] : undefined,
  }));
}

export function formatRound(match) {
  if (match.format === 'round_robin') return 'Round robin';
  const total = Number(match.total_rounds);
  if (!total) return `Round ${match.round}`;
  if (match.round === total) return 'Final';
  if (match.round === total - 1) return 'Semifinal';
  if (match.round === total - 2) return 'Quarterfinal';
  return `Round ${match.round}`;
}

export function toDatetimeLocal(value) {
  const date = toDate(value);
  if (!date) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function fromDatetimeLocal(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function firstName(name = '') {
  return name.trim().split(/\s+/)[0] || 'there';
}

export function matchSort(a, b) {
  const priority = { ongoing: 0, scheduled: 1, completed: 2 };
  const pa = priority[a.status] ?? 3;
  const pb = priority[b.status] ?? 3;
  if (pa !== pb) return pa - pb;

  const at = toDate(a.scheduled_at)?.getTime();
  const bt = toDate(b.scheduled_at)?.getTime();
  if (a.status === 'completed') {
    return (bt ?? 0) - (at ?? 0);
  }
  if (at && bt) return at - bt;
  if (at) return -1;
  if (bt) return 1;
  return 0;
}

export const roundRobinLabel = 'Round robin';
