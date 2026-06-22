import { h, icon } from "../../../core/utils/dom.js";
import { listProductores, setSellosVerificados, listAll } from "../admin-service.js";

// Admin "Productores" — approved producers + seal verification (doc §4.5, §8). A
// seal is "verified" only when the admin moves it into sellosVerificados.
export function createProductoresSection() {
  const state = { items: [], sellos: [], loading: true, editingId: null, verificados: new Set(), busy: false };
  const root = h("section", { class: "admin-section" });

  async function reload() {
    state.loading = true;
    paint();
    try {
      const [items, sellos] = await Promise.all([listProductores("aprobado"), listAll("sellos")]);
      state.items = items;
      state.sellos = sellos;
    } catch (err) {
      console.error("[admin/productores] cargar falló:", err?.code, err);
    }
    state.loading = false;
    paint();
  }

  function selloNombre(id) {
    return state.sellos.find((s) => s.id === id)?.nombre ?? id;
  }

  function openEditor(p) {
    state.editingId = p.id;
    state.verificados = new Set(p.sellosVerificados ?? []);
    paint();
  }

  async function guardar(p) {
    state.busy = true;
    paint();
    try {
      await setSellosVerificados(p.id, [...state.verificados]);
      state.busy = false;
      state.editingId = null;
      await reload();
    } catch (err) {
      console.error("[admin/productores] guardar sellos falló:", err?.code, err);
      alert("No se pudieron guardar los sellos.");
      state.busy = false;
      paint();
    }
  }

  function renderEditor(p) {
    const declarados = p.sellosDeclarados ?? [];
    return h("div", { class: "admin-form" }, [
      h("div", { class: "admin-field__label", text: `Sellos de ${p.nombre}` }),
      declarados.length === 0
        ? h("p", { class: "admin-muted", text: "Este productor no declaró sellos." })
        : h("div", { class: "sello-list" },
            declarados.map((id) => {
              const on = state.verificados.has(id);
              return h("button", {
                class: `sello-item ${on ? "is-on" : ""}`, type: "button",
                onclick: () => { on ? state.verificados.delete(id) : state.verificados.add(id); paint(); },
              }, [
                h("span", { class: `sello-check ${on ? "is-on" : ""}` }, [on ? icon("check") : null]),
                h("span", { text: selloNombre(id) }),
              ]);
            })),
      h("div", { class: "admin-form__actions" }, [
        h("button", { class: "btn btn--primary", type: "button", disabled: state.busy ? "true" : null,
          onclick: () => guardar(p), text: state.busy ? "Guardando…" : "Guardar sellos" }),
        h("button", { class: "btn btn--ghost", type: "button", onclick: () => { state.editingId = null; paint(); }, text: "Cancelar" }),
      ]),
    ]);
  }

  function renderList() {
    if (state.loading) return h("p", { class: "admin-muted", text: "Cargando productores…" });
    if (state.items.length === 0) return h("p", { class: "admin-muted", text: "Todavía no hay productores aprobados." });
    return h("ul", { class: "admin-list" },
      state.items.map((p) => {
        if (state.editingId === p.id) return h("li", { class: "admin-list__item" }, [renderEditor(p)]);
        const loc = p.ubicacion?.localidad ?? "Sin localidad";
        const verif = p.sellosVerificados?.length ?? 0;
        const decl = p.sellosDeclarados?.length ?? 0;
        return h("li", { class: "admin-list__item" }, [
          h("div", { class: "admin-list__info" }, [
            h("div", { class: "admin-list__title", text: p.nombre }),
            h("div", { class: "admin-list__sub", text: `${loc} · ${verif}/${decl} sellos verificados` }),
          ]),
          h("button", { class: "btn btn--ghost btn--sm", type: "button", onclick: () => openEditor(p) }, [icon("certificate"), "Sellos"]),
        ]);
      })
    );
  }

  function paint() {
    root.replaceChildren(
      h("div", { class: "admin-section__head" }, [h("h2", { text: "Productores" })]),
      renderList()
    );
  }

  reload();
  return root;
}
