export function formatMoney(amount: number, currency = 'RUB'): string {
  const symbols: Record<string, string> = { RUB: '₽', USD: '$', EUR: '€' };
  const symbol = symbols[currency] || currency;
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('ru-RU', { maximumFractionDigits: 0 });
  return `${sign}${formatted} ${symbol}`;
}

export function formatSignedMoney(amount: number, currency = 'RUB'): string {
  const sign = amount > 0 ? '+' : '';
  return `${sign}${formatMoney(amount, currency)}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
}

export function formatDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function formatDayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return 'Сегодня';
  if (sameDay(date, yesterday)) return 'Вчера';
  if (sameDay(date, tomorrow)) return 'Завтра';
  return formatDateLong(iso);
}

export function groupByDay<T extends { date: string }>(items: T[]): { date: string; items: T[] }[] {
  const map = new Map<string, T[]>();
  items.forEach((item) => {
    const key = item.date.slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  });
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({ date, items }));
}
