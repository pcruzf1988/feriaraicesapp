import { h, icon } from "../../../core/utils/dom.js";
import { session } from "../../auth/auth-store.js";
import { getProfile } from "../productor-service.js";
import {
  listByProducer, listCategorias, createProducto, updateProducto, deleteProducto, uploadFoto,
} from "../productos-service.js";
import { validateProducto, UNIDADES, DISPONIBILIDADES } from "../domain/producto.js";

const DISP_LABEL = { disponible: "Disponible", poca: "Poca", sin_stock: "Sin stock" };
const MAX_FOTOS = 4;
const peso = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n ?? 0);

export function misProductosView({ navigate } = {}) {
  const uid = session.get()?.user?.uid;
  const state = {
    loading: true, profile: null, categorias: [], productos: [],
    editingId: null, form: null, errors: {}, busy: false, fotosBusy: false,
  };
  const root = h("section", { class: "productos" });

  async function load() {
    try {
      const [profile, categorias, productos] = await Promise.all([
        getProfile(uid), listCategorias(), listByProducer(uid),
      ]);
      state.profile = profile;
      state.categorias = categorias;
      state.productos = productos;
    } catch (err) {
      console.error("[productos] load falló:", err?.code, err);
    }
    state.loading = false;
    paint();
  }

  function emptyForm() {
    return { nombrePrincipal: "", otrosNombres: "", categoriaId: "", descripcion: "", precio: "", unidad: "", disponibilidad: "disponible", fotos: [] };
  }

  function openForm(p) {
    state.errors = {};
    if (p) {
      state.editingId = p.id;
      state.form = {
        nombrePrincipal: p.nombrePrincipal ?? "", otrosNombres: (p.otrosNombres ?? []).join(", "),
        categoriaId: p.categoriaId ?? "", descripcion: p.descripcion ?? "", precio: p.precio ?? "",
        unidad: p.unidad ?? "", disponibilidad: p.disponibilidad ?? "disponible", fotos: [...(p.fotos ?? [])],
      };
    } else {
      state.editingId = "new";
      state.form = emptyForm();
    }
    paint();
  }

  function closeForm() { state.editingId = null; state.form = null; state.errors = {}; paint(); }

  function syncFormFromDom() {
    const f = state.form;
    for (const name of ["nombrePrincipal", "otrosNombres", "descripcion", "precio"]) {
      const el = root.querySelector(`[name="${name}"]`);
      if (el) f[name] = el.value;
    }
    for (const name of ["categoriaId", "unidad", "disponibilidad"]) {
      const el = root.querySelector(`[name="${name}"]`);
      if (el) f[name] = el.value;
    }
  }

  async function onPickFotos(files) {
    syncFormFromDom();
    const room = MAX_FOTOS - state.form.fotos.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    if (list.length === 0) return;
    state.fotosBusy = true; paint();
    for (const file of list) {
      try {
        const url = await uploadFoto(uid, file);
        state.form.fotos.push(url);
      } catch (err) {
        console.error("[productos] uploadFoto falló:", err?.code, err);
        state.errors = { _: "No se pudo subir una foto. Probá de nuevo." };
      }
    }
    state.fotosBusy = false; paint();
  }

  function removeFoto(url) {
    syncFormFromDom();
    state.form.fotos = state.form.fotos.filter((u) => u !== url);
    paint();
  }

  async function save(e) {
    e.preventDefault();
    if (state.busy) return;
    syncFormFromDom();
    const f = state.form;
    const result = validateProducto(f);
    if (!result.valid) { state.errors = result.errors; paint(); return; }
    state.busy = true; state.errors = {}; paint();
    const data = {
      nombrePrincipal: f.nombrePrincipal,
      otrosNombres: f.otrosNombres.split(",").map((s) => s.trim()).filter(Boolean),
      categoriaId: f.categoriaId, descripcion: f.descripcion, precio: f.precio,
      unidad: f.unidad, disponibilidad: f.disponibilidad, fotos: f.fotos,
    };
    try {
      if (state.editingId === "new") await createProducto(state.profile, data);
      else await updateProducto(state.editingId, state.profile, data);
      closeForm();
      state.loading = true; paint();
      await load();
    } catch (err) {
      console.error("[productos] guardar falló:", err?.code, err);
      state.errors = { _: "No se pudo guardar el producto." };
      state.busy = false; paint();
    }
  }

  async function del(p) {
    if (!confirm(`¿Borrar "${p.nombrePrincipal}"?`)) return;
    try { await deleteProducto(p.id); state.loading = true; paint(); await load(); }
    catch (err) { console.error("[productos] borrar falló:", err?.code, err); alert("No se pudo borrar."); }
  }

  function fotoStrip() {
    const f = state.form;
    return h("div", { class: "foto-strip" }, [
      ...f.fotos.map((url) => h("div", { class: "foto-thumb" }, [
        h("img", { src: url, alt: "" }),
        h("button", { class: "foto-thumb__x", type: "button", "aria-label": "Quitar foto", onclick: () => removeFoto(url) }, [icon("x")]),
      ])),
      f.fotos.length < MAX_FOTOS &&
        h("label", { class: "foto-add" }, [
          state.fotosBusy ? h("span", { text: "Subiendo…" }) : icon("camera-plus"),
          h("input", { type: "file", accept: "image/*", multiple: "true", hidden: "true", onchange: (e) => onPickFotos(e.target.files) }),
        ]),
    ]);
  }

  function selectRow(name, label, options, current, optionLabel) {
    return h("div", { class: "admin-field" }, [
      h("label", { class: "admin-field__label", text: label }),
      h("select", { class: "input", name }, [
        h("option", { value: "", text: `Elegí…` }),
        ...options.map((o) => {
          const val = typeof o === "string" ? o : o.id;
          const lab = optionLabel ? optionLabel(o) : (typeof o === "string" ? o : o.nombre);
          return h("option", { value: val, text: lab, selected: current === val ? "selected" : null });
        }),
      ]),
      state.errors[name] && h("div", { class: "admin-field__error", text: state.errors[name] }),
    ]);
  }

  function inputRow(name, label, placeholder, type = "text") {
    return h("div", { class: "admin-field" }, [
      h("label", { class: "admin-field__label", text: label }),
      h("input", { class: "input", name, type, placeholder, value: state.form[name] }),
      state.errors[name] && h("div", { class: "admin-field__error", text: state.errors[name] }),
    ]);
  }

  function renderForm() {
    const f = state.form;
    return h("form", { class: "admin-form", onsubmit: save }, [
      h("div", { class: "admin-field" }, [
        h("label", { class: "admin-field__label", text: `Fotos (hasta ${MAX_FOTOS})` }),
        fotoStrip(),
      ]),
      inputRow("nombrePrincipal", "Nombre del producto", "Ej. Maíz criollo"),
      inputRow("otrosNombres", "Otros nombres (separados por coma)", "Ej. Capia, maíz blanco"),
      selectRow("categoriaId", "Categoría", state.categorias, f.categoriaId),
      h("div", { class: "admin-field" }, [
        h("label", { class: "admin-field__label", text: "Descripción" }),
        h("textarea", { class: "input", name: "descripcion", rows: "3", placeholder: "Contá sobre tu producto" }, [f.descripcion]),
      ]),
      h("div", { class: "form-row2" }, [
        inputRow("precio", "Precio ($)", "0", "number"),
        selectRow("unidad", "Unidad", UNIDADES, f.unidad),
      ]),
      selectRow("disponibilidad", "Disponibilidad", DISPONIBILIDADES, f.disponibilidad, (d) => DISP_LABEL[d]),
      state.errors._ && h("div", { class: "auth-error", text: state.errors._ }),
      h("div", { class: "admin-form__actions" }, [
        h("button", { class: "btn btn--primary", type: "submit", disabled: state.busy || state.fotosBusy ? "true" : null, text: state.busy ? "Guardando…" : "Guardar" }),
        h("button", { class: "btn btn--ghost", type: "button", onclick: closeForm, text: "Cancelar" }),
      ]),
    ]);
  }

  function renderList() {
    if (state.productos.length === 0) {
      return h("p", { class: "admin-muted", text: "Todavía no cargaste productos. Tocá «Agregar producto» para empezar." });
    }
    return h("ul", { class: "admin-list" }, state.productos.map((p) =>
      h("li", { class: "admin-list__item" }, [
        h("div", { class: "producto-thumb" }, [p.fotos?.[0] ? h("img", { src: p.fotos[0], alt: "" }) : icon("basket")]),
        h("div", { class: "admin-list__info" }, [
          h("div", { class: "admin-list__title", text: p.nombrePrincipal }),
          h("div", { class: "admin-list__sub" }, [
            `${peso(p.precio)} /${p.unidad} · `,
            h("span", { class: `badge-avail badge-avail--${p.disponibilidad}`, text: DISP_LABEL[p.disponibilidad] ?? "" }),
          ]),
        ]),
        h("button", { class: "icon-btn", type: "button", "aria-label": "Editar", onclick: () => openForm(p) }, [icon("pencil")]),
        h("button", { class: "icon-btn icon-btn--danger", type: "button", "aria-label": "Borrar", onclick: () => del(p) }, [icon("trash")]),
      ])
    ));
  }

  function paint() {
    if (state.loading) { root.replaceChildren(h("p", { class: "admin-muted", text: "Cargando tus productos…" })); return; }
    if (!state.profile) {
      root.replaceChildren(
        h("h1", { style: "font-size:20px;margin-bottom:8px;", text: "Primero completá tu alta" }),
        h("p", { class: "admin-muted", text: "Necesitás crear tu perfil de productor antes de cargar productos." }),
        h("button", { class: "btn btn--primary btn--block", style: "margin-top:16px;", onclick: () => navigate("/productor") }, "Ir a mi alta")
      );
      return;
    }
    root.replaceChildren(
      h("div", { class: "admin-topbar" }, [
        h("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: () => navigate("/productor") }, [icon("arrow-left"), "Mi panel"]),
        state.editingId == null &&
          h("button", { class: "btn btn--primary btn--sm", type: "button", onclick: () => openForm(null) }, [icon("plus"), "Agregar producto"]),
      ]),
      h("h1", { style: "font-size:20px;margin:8px 0 12px;", text: "Mis productos" }),
      state.editingId != null ? renderForm() : renderList()
    );
  }

  paint();
  load();
  return root;
}
