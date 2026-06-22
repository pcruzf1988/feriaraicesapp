import { h, icon } from "../../../core/utils/dom.js";
import { listProductores, setProductorEstado } from "../admin-service.js";

// Admin "Solicitudes" — pending producers awaiting approval (doc §4.5). Approving
// publishes their profile and products (setProductorEstado propagates the flag).
export function createSolicitudesSection() {
  const state = { items: [], loading: true, busy: null };
  const root = h("section", { class: "admin-section" });

  async function reload() {
    state.loading = true;
    paint();
    try {
      state.items = await listProductores("pendiente");
    } catch (err) {
      console.error("[admin/solicitudes] cargar falló:", err?.code, err);
    }
    state.loading = false;
    paint();
  }

  async function decidir(p, estado) {
    if (estado === "rechazado" && !confirm(`¿Rechazar la solicitud de "${p.nombre}"?`)) return;
    state.busy = p.id;
    paint();
    try {
      await setProductorEstado(p.id, estado);
      await reload();
    } catch (err) {
      console.error("[admin/solicitudes] decidir falló:", err?.code, err);
      alert("No se pudo guardar el cambio.");
      state.busy = null;
      paint();
    }
  }

  function renderList() {
    if (state.loading) return h("p", { class: "admin-muted", text: "Cargando solicitudes…" });
    if (state.items.length === 0) return h("p", { class: "admin-muted", text: "No hay solicitudes pendientes. 🌱" });
    return h("ul", { class: "admin-list" },
      state.items.map((p) => {
        const loc = p.ubicacion?.localidad ? `${p.ubicacion.localidad}, ${p.ubicacion.provincia ?? ""}` : "Sin localidad";
        const sellos = p.sellosDeclarados?.length ? `${p.sellosDeclarados.length} sello(s) declarado(s)` : "Sin sellos declarados";
        const busy = state.busy === p.id;
        return h("li", { class: "admin-list__item solicitud" }, [
          h("div", { class: "admin-list__info" }, [
            h("div", { class: "admin-list__title", text: p.nombre }),
            h("div", { class: "admin-list__sub", text: `${loc} · ${sellos}` }),
          ]),
          h("div", { class: "solicitud__actions" }, [
            h("button", { class: "btn btn--primary btn--sm", type: "button", disabled: busy ? "true" : null,
              onclick: () => decidir(p, "aprobado") }, [icon("check"), "Aprobar"]),
            h("button", { class: "btn btn--ghost btn--sm", type: "button", disabled: busy ? "true" : null,
              onclick: () => decidir(p, "rechazado") }, [icon("x"), "Rechazar"]),
          ]),
        ]);
      })
    );
  }

  function paint() {
    root.replaceChildren(
      h("div", { class: "admin-section__head" }, [h("h2", { text: "Solicitudes" })]),
      renderList()
    );
  }

  reload();
  return root;
}
