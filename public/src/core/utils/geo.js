// Country-agnostic geo port. The app talks to THIS module, never to a specific
// country's API. Today only Argentina (Georef) is wired; Bolivia and Brasil
// (doc §7.1) plug in here later as new adapters — no UI changes needed.
//
// An adapter implements: getRegions() -> [string], getLocalities(region) -> [{nombre,lat,lng}].

import * as argentina from "./georef.js";

const ADAPTERS = {
  Argentina: argentina,
  // Bolivia: ...  (a futuro)
  // Brasil: ...   (a futuro: IBGE)
};

// Countries currently supported, in display order.
export const PAISES = ["Argentina"];

// What a "region" is called per country (provincia / departamento / estado).
export function regionLabel(pais) {
  return { Argentina: "Provincia", Bolivia: "Departamento", Brasil: "Estado" }[pais] ?? "Región";
}

function adapterFor(pais) {
  const a = ADAPTERS[pais];
  if (!a) throw new Error(`País no soportado todavía: ${pais}`);
  return a;
}

export function listRegions(pais) {
  return adapterFor(pais).getRegions();
}

export function listLocalities(pais, region) {
  return adapterFor(pais).getLocalities(region);
}
