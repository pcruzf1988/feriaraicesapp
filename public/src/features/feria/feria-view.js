import { h, icon } from "../../core/utils/dom.js";
import { createProductCard } from "../../ui/components/product-card.js";
import { listProductosAprobados, listCategorias } from "./feria-service.js";
import { filtrarProductos } from "./domain/filtrar.js";
import { orderByCloseness } from "./domain/cercania.js";
import { getRef, setRef } from "./ref-localidad.js";
import { session } from "../auth/auth-store.js";
import { listRegions, listLocalities, PAISES } from "../../core/utils/geo.js";

// La Feria — real marketplace (doc §4.5). Reads approved products from Firestore,
// applies search + category filter, and orders by closeness to the consumer's
// reference locality (bands Local→Regional→Nacional, random within each; far
// products are shown, never hidden). The search input is kept persistent so
// typing never loses focus — only the grid re-renders.
export function feriaView({ navigate } = {}) {
  const state = {
    loading: true,
    productos: [],
    categorias: [],
    q: "",
    categoriaId: "",
    ref: getRef() || session.get()?.profile?.localidadReferencia || null,
    pickingRef: false,
    regions: [],
    localities: [],
    pickProvincia: "",
  };

  const root = h("section", {});
  const els = {};

  async function load() {
    try {
      const [productos, categorias] = await Promise.all([listProductosAprobados(), listCategorias()]);
      state.productos = productos;
      state.categorias = categorias;
    } catch (err) {
      console.error("[feria] load falló:", err?.code, err);
    }
    state.loading = false;
    paintGrid();
    paintChips();
  }

  function visibleProductos() {
    const filtered = filtrarProductos(state.productos, { q: state.q, categoriaId: state.categoriaId });
    const refCoords = state.ref && state.ref.lat != null ? { lat: state.ref.lat, lng: state.ref.lng } : null;
    return orderByCloseness(filtered, refCoords);
  }

  function paintGrid() {
    if (state.loading) {
      els.grid.replaceChildren(h("p", { class: "admin-muted", text: "Cargando la feria…" }));
      return;
    }
    const items = visibleProductos();
    if (items.length === 0) {
      els.grid.replaceChildren(h("p", { class: "admin-muted", text: "No encontramos productos con esos filtros." }));
      return;
    }
    els.grid.replaceChildren(
      h("div", { class: "product-grid" },
        items.map((p) => createProductCard(p, { onOpen: (prod) => navigate(`/producto/${prod.id}`) })))
    );
  }

  function paintChips() {
    const chip = (label, id) =>
      h("button", {
        class: `chip ${state.categoriaId === id ? "chip--selected" : ""}`,
        type: "button",
        onclick: () => { state.categoriaId = id; paintChips(); paintGrid(); },
        text: label,
      });
    els.chips.replaceChildren(
      chip("Todas", ""),
      ...state.categorias.map((c) => chip(c.nombre, c.id))
    );
  }

  function paintRefRow() {
    const label = state.ref ? `Recibís en ${state.ref.localidad}` : "Elegí dónde recibís tus productos";
    const rows = [
      h("button", { class: "ref-pill", type: "button", onclick: () => { state.pickingRef = !state.pickingRef; if (state.pickingRef && state.regions.length === 0) loadRegions(); paintRefRow(); } },
        [icon("map-pin"), h("span", { text: label }), icon("chevron-down")]),
    ];
    if (state.pickingRef) {
      rows.push(h("div", { class: "ref-picker" }, [
        h("select", { class: "input", onchange: (e) => onPickProvincia(e.target.value) }, [
          h("option", { value: "", text: state.regions.length ? "Provincia" : "Cargando…" }),
          ...state.regions.map((r) => h("option", { value: r, text: r, selected: state.pickProvincia === r ? "selected" : null })),
        ]),
        h("select", { class: "input", disabled: state.localities.length === 0 ? "true" : null, onchange: (e) => onPickLocalidad(e.target.value) }, [
          h("option", { value: "", text: state.localities.length ? "Localidad" : "Elegí provincia" }),
          ...state.localities.map((l) => h("option", { value: l.nombre, text: l.nombre })),
        ]),
      ]));
    }
    els.refRow.replaceChildren(...rows);
  }

  async function loadRegions() {
    try { state.regions = await listRegions(PAISES[0]); } catch {}
    paintRefRow();
  }
  async function onPickProvincia(prov) {
    state.pickProvincia = prov;
    state.localities = [];
    paintRefRow();
    if (!prov) return;
    try { state.localities = await listLocalities(PAISES[0], prov); } catch {}
    paintRefRow();
  }
  function onPickLocalidad(nombre) {
    const loc = state.localities.find((l) => l.nombre === nombre);
    if (!loc) return;
    state.ref = { pais: PAISES[0], provincia: state.pickProvincia, localidad: nombre, lat: loc.lat, lng: loc.lng };
    setRef(state.ref);
    state.pickingRef = false;
    paintRefRow();
    paintGrid();
  }

  els.refRow = h("div", { class: "ref-row" });
  els.chips = h("div", { class: "chip-row" });
  els.grid = h("div", {});
  const search = h("input", {
    class: "input feria-search",
    type: "search",
    placeholder: "Buscar productos…",
    oninput: (e) => { state.q = e.target.value; paintGrid(); },
  });

  root.replaceChildren(
    h("h1", { class: "display-heading", text: "La feria está abierta" }),
    h("p", { class: "section-subtitle", text: "Productos agroecológicos, directo del productor" }),
    els.refRow,
    h("div", { style: "margin:12px 0;" }, [search]),
    els.chips,
    h("div", { style: "margin-top:12px;" }, [els.grid])
  );

  paintRefRow();
  paintChips();
  paintGrid();
  load();
  return root;
}
