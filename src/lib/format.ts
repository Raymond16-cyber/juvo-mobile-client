export function formatDate(
  value?: string | Date,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}

export function normalizeCurrency(currency?: string | null) {
  const code = String(currency || "USD").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : "USD";
}

export function formatMoney(value: number, currency = "USD") {
  const code = normalizeCurrency(currency);
  const absolute = Math.abs(value);

  let formatted: string;
  try {
    formatted = new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      maximumFractionDigits: absolute >= 1000 ? 0 : 2,
    }).format(absolute);
  } catch {
    formatted = `${code} ${absolute.toFixed(absolute >= 1000 ? 0 : 2)}`;
  }

  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function formatCompactMoney(value: number, currency = "USD") {
  const code = normalizeCurrency(currency);
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: code,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return `${code} ${value}`;
  }
}

export function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, digits = 1) {
  return `${formatNumber(value, digits)}%`;
}

export function formatCompactNumber(value: number) {
  try {
    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  } catch {
    return String(value);
  }
}

export function titleCase(value: string) {
  return value
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function greetingForHour(hour = new Date().getHours()) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
