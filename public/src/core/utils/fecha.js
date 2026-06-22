// Pure relative-time formatting in Spanish — for "última actualización" labels
// (doc §4.5 ficha de producto). Accepts a Date or a millisecond timestamp; `now`
// is injectable so the logic stays deterministic and testable. Firestore
// Timestamps must be converted (`.toDate()`) by the caller before reaching here.

const DAY = 24 * 60 * 60 * 1000;

export function formatRelativo(date, now = new Date()) {
  if (date == null) return "";
  const then = date instanceof Date ? date.getTime() : Number(date);
  const days = Math.floor((now.getTime() - then) / DAY);

  if (days <= 0) return "hoy";
  if (days === 1) return "ayer";
  if (days < 7) return `hace ${days} días`;
  if (days < 30) {
    const semanas = Math.floor(days / 7);
    return `hace ${semanas} ${semanas === 1 ? "semana" : "semanas"}`;
  }
  const meses = Math.floor(days / 30);
  return `hace ${meses} ${meses === 1 ? "mes" : "meses"}`;
}
