export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function dayKey(d: Date | string) {
  const x = typeof d === "string" ? new Date(d) : d;
  return startOfDay(x).toISOString().slice(0, 10);
}

export function rangeDays(days: number) {
  const end = startOfDay(new Date());
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return { start, end, sinceISO: start.toISOString() };
}

export function bucketByDay<T>(rows: T[], getDate: (r: T) => string | Date, days: number) {
  const { start } = rangeDays(days);
  const counts: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    counts[dayKey(d)] = 0;
  }
  for (const r of rows) {
    const k = dayKey(getDate(r));
    if (k in counts) counts[k]++;
  }
  return Object.entries(counts).map(([date, count]) => ({
    date,
    label: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    count,
  }));
}

export function bucketByDayGrouped<T>(
  rows: T[],
  getDate: (r: T) => string | Date,
  getGroup: (r: T) => string,
  days: number,
  groups: string[],
) {
  const { start } = rangeDays(days);
  const map: Record<string, Record<string, number>> = {};
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k = dayKey(d);
    map[k] = Object.fromEntries(groups.map((g) => [g, 0]));
  }
  for (const r of rows) {
    const k = dayKey(getDate(r));
    const g = getGroup(r);
    if (map[k] && g in map[k]) map[k][g]++;
  }
  return Object.entries(map).map(([date, vals]) => ({
    date,
    label: new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    ...vals,
  }));
}

export function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 100);
}
