// The consumer's reference locality (where they want closeness measured from —
// doc §5.1). Persisted in localStorage so it works for anonymous visitors too and
// survives reloads. Shape: { pais, provincia, localidad, lat, lng }.

const KEY = "feria-ref-localidad";

export function getRef() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

export function setRef(ref) {
  localStorage.setItem(KEY, JSON.stringify(ref));
}
