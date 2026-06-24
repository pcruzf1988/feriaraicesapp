import { h, icon } from "../../../core/utils/dom.js";
import { listAll, createDoc, updateDocById, removeDoc } from "../admin-service.js";

// Generic master-data CRUD section, configured by `fields`. Reused for categorías,
// sellos and recetas so the create/edit/list/delete logic lives in one place.
//
// config:
//   { title, coll, orderField?, validate, itemTitle, itemSubtitle?, fields }
// fields: [{ name, label, type: "text"|"textarea"|"number"|"lines", placeholder? }]
//   "lines" maps a textarea (one item per line) to/from a string array.

function fieldToDoc(field, raw) {
  if (field.type === "number") return Number(raw) || 0;
  if (field.type === "lines") {
    return String(raw)
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return String(raw).trim();
}

function docToField(field, value) {
  if (field.type === "lines") return Array.isArray(value) ? value.join("\n") : "";
  return value ?? "";
}

export function createCrudSection(config) {
  const { title, coll, orderField, validate, itemTitle, itemSubtitle, fields } = config;
  const state = { items: [], loading: true, editingId: null, form: {}, errors: {}, busy: false, uploadingField: null };
  const root = h("section", { class: "admin-section" });

  async function reload() {
    state.loading = true;
    paint();
    state.items = await listAll(coll, orderField);
    state.loading = false;
    paint();
  }

  function openForm(item) {
    state.editingId = item ? item.id : "new";
    state.errors = {};
    state.form = {};
    for (const f of fields) state.form[f.name] = item ? docToField(f, item[f.name]) : "";
    paint();
  }

  function closeForm() {
    state.editingId = null;
    state.errors = {};
    paint();
  }

  function readForm() {
    const data = {};
    for (const f of fields) {
      if (f.type === "image") {
        data[f.name] = (state.form[f.name] || "").trim();
        continue;
      }
      const raw = root.querySelector(`[name="${f.name}"]`)?.value ?? "";
      data[f.name] = fieldToDoc(f, raw);
    }
    return data;
  }

  // Keeps typed (uncontrolled) values across a repaint — e.g. while an image
  // uploads — so the form doesn't lose what the admin already wrote.
  function syncFormFromDom() {
    for (const f of fields) {
      if (f.type === "image") continue; // value lives in state.form, not in a file input
      const el = root.querySelector(`[name="${f.name}"]`);
      if (el) state.form[f.name] = el.value;
    }
  }

  async function onPickImage(field, file) {
    if (!file || !field.upload) return;
    syncFormFromDom();
    state.uploadingField = field.name;
    delete state.errors[field.name];
    paint();
    try {
      state.form[field.name] = await field.upload(file);
    } catch (err) {
      console.error(`[admin/${coll}] subir imagen falló:`, err?.code, err);
      state.errors[field.name] = "No se pudo subir la imagen.";
    }
    state.uploadingField = null;
    paint();
  }

  async function save(e) {
    e.preventDefault();
    if (state.busy) return;
    const data = readForm();
    const result = validate ? validate(data) : { valid: true, errors: {} };
    if (!result.valid) {
      state.errors = result.errors;
      paint();
      return;
    }
    state.busy = true;
    paint();
    try {
      if (state.editingId === "new") await createDoc(coll, data);
      else await updateDocById(coll, state.editingId, data);
      state.busy = false;
      state.editingId = null;
      await reload();
    } catch (err) {
      console.error(`[admin/${coll}] guardar falló:`, err?.code, err);
      state.errors = { _: "No se pudo guardar. Revisá tu conexión y permisos." };
      state.busy = false;
      paint();
    }
  }

  async function del(item) {
    if (!confirm(`¿Borrar "${itemTitle(item)}"? Esta acción no se puede deshacer.`)) return;
    try {
      await removeDoc(coll, item.id);
      await reload();
    } catch (err) {
      console.error(`[admin/${coll}] borrar falló:`, err?.code, err);
      alert("No se pudo borrar.");
    }
  }

  function renderField(f) {
    if (f.type === "image") {
      const url = state.form[f.name];
      return h("div", { class: "admin-field" }, [
        h("label", { class: "admin-field__label", text: f.label }),
        h("div", { class: "admin-image-field" }, [
          h("div", { class: "admin-image-preview" }, [
            url ? h("img", { src: url, alt: f.label }) : icon("photo"),
          ]),
          h("label", { class: "btn btn--ghost btn--sm" }, [
            state.uploadingField === f.name ? "Subiendo…" : (url ? "Cambiar imagen" : "Subir imagen"),
            h("input", {
              type: "file", accept: "image/*", hidden: "true",
              onchange: (e) => onPickImage(f, e.target.files?.[0]),
            }),
          ]),
        ]),
        state.errors[f.name] && h("div", { class: "admin-field__error", text: state.errors[f.name] }),
      ]);
    }
    const common = { class: "input", name: f.name, placeholder: f.placeholder ?? "", value: state.form[f.name] ?? "" };
    const input =
      f.type === "textarea" || f.type === "lines"
        ? h("textarea", { ...common, rows: f.type === "lines" ? "4" : "3" }, [state.form[f.name] ?? ""])
        : h("input", { ...common, type: f.type === "number" ? "number" : "text" });
    return h("div", { class: "admin-field" }, [
      h("label", { class: "admin-field__label", text: f.label }),
      input,
      state.errors[f.name] && h("div", { class: "admin-field__error", text: state.errors[f.name] }),
    ]);
  }

  function renderForm() {
    return h("form", { class: "admin-form", onsubmit: save }, [
      ...fields.map(renderField),
      state.errors._ && h("div", { class: "auth-error", text: state.errors._ }),
      h("div", { class: "admin-form__actions" }, [
        h("button", { class: "btn btn--primary", type: "submit", disabled: state.busy ? "true" : null, text: state.busy ? "Guardando…" : "Guardar" }),
        h("button", { class: "btn btn--ghost", type: "button", onclick: closeForm, text: "Cancelar" }),
      ]),
    ]);
  }

  function renderList() {
    if (state.loading) return h("p", { class: "admin-muted", text: "Cargando…" });
    if (state.items.length === 0) return h("p", { class: "admin-muted", text: "Todavía no hay nada acá. Agregá el primero." });
    return h("ul", { class: "admin-list" },
      state.items.map((item) =>
        h("li", { class: "admin-list__item" }, [
          h("div", { class: "admin-list__info" }, [
            h("div", { class: "admin-list__title", text: itemTitle(item) }),
            itemSubtitle && h("div", { class: "admin-list__sub", text: itemSubtitle(item) }),
          ]),
          h("button", { class: "icon-btn", type: "button", "aria-label": "Editar", onclick: () => openForm(item) }, [icon("pencil")]),
          h("button", { class: "icon-btn icon-btn--danger", type: "button", "aria-label": "Borrar", onclick: () => del(item) }, [icon("trash")]),
        ])
      )
    );
  }

  function paint() {
    root.replaceChildren(
      h("div", { class: "admin-section__head" }, [
        h("h2", { text: title }),
        state.editingId == null &&
          h("button", { class: "btn btn--primary btn--sm", type: "button", onclick: () => openForm(null) }, [icon("plus"), "Agregar"]),
      ]),
      state.editingId != null ? renderForm() : renderList()
    );
  }

  reload();
  return root;
}
