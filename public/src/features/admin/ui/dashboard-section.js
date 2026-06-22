import { h, icon } from "../../../core/utils/dom.js";
import { listAll } from "../admin-service.js";
import {
  productosMasVistos,
  productosMasPedidos,
  origenConsumidores,
  demografia,
  resumenProductores,
} from "../domain/metricas.js";

const GENERO_LABEL = { F: "Femenino", M: "Masculino", Otro: "Otro", NS: "Prefiere no decir" };

// Admin dashboard (doc §10) — market analysis to help value producers. Reads the
// raw collections, aggregates them with the pure metrics domain, and renders
// simple ranked lists (vanilla, no chart library).
export function createDashboardSection() {
  const state = { loading: true, productos: [], pedidos: [], usuarios: [], productores: [] };
  const root = h("section", { class: "admin-section" });

  async function reload() {
    state.loading = true;
    paint();
    try {
      const [productos, pedidos, usuarios, productores] = await Promise.all([
        listAll("productos"), listAll("pedidos"), listAll("usuarios"), listAll("productores"),
      ]);
      Object.assign(state, { productos, pedidos, usuarios, productores });
    } catch (err) {
      console.error("[admin/dashboard] cargar falló:", err?.code, err);
    }
    state.loading = false;
    paint();
  }

  function statCard(label, value, iconName) {
    return h("div", { class: "stat-card" }, [
      icon(iconName, "stat-card__icon"),
      h("div", { class: "stat-card__value", text: String(value) }),
      h("div", { class: "stat-card__label", text: label }),
    ]);
  }

  function rankBlock(title, rows) {
    return h("div", { class: "dash-block" }, [
      h("h3", { class: "dash-block__title", text: title }),
      rows.length === 0
        ? h("p", { class: "admin-muted", text: "Todavía no hay datos." })
        : h("ul", { class: "dash-rank" },
            rows.map((r) =>
              h("li", { class: "dash-rank__row" }, [
                h("span", { class: "dash-rank__name", text: r.name }),
                h("span", { class: "dash-rank__val", text: r.val }),
              ]))),
    ]);
  }

  function paint() {
    if (state.loading) {
      root.replaceChildren(h("p", { class: "admin-muted", text: "Calculando estadísticas…" }));
      return;
    }

    const resumen = resumenProductores(state.productores);
    const vistos = productosMasVistos(state.productos).map((p) => ({ name: p.nombrePrincipal, val: `${p.vistas} vistas` }));
    const pedidos = productosMasPedidos(state.pedidos).map((p) => ({ name: p.nombre, val: `${p.pedidos} pedido(s) · ${p.unidades} u.` }));
    const origen = origenConsumidores(state.usuarios).map((o) => ({ name: o.provincia, val: `${o.total}` }));
    const demo = demografia(state.usuarios);
    const edades = Object.entries(demo.rangoEtario).map(([k, v]) => ({ name: k, val: `${v}` }));
    const generos = Object.entries(demo.genero).map(([k, v]) => ({ name: GENERO_LABEL[k] ?? k, val: `${v}` }));

    root.replaceChildren(
      h("div", { class: "admin-section__head" }, [h("h2", { text: "Panel de estadísticas" })]),
      h("p", { class: "admin-muted", text: "Análisis de mercado para acompañar y valorizar a los productores." }),

      h("div", { class: "stat-grid" }, [
        statCard("Aprobados", resumen.aprobado, "circle-check"),
        statCard("Pendientes", resumen.pendiente, "clock"),
        statCard("Productos", state.productos.length, "basket"),
        statCard("Pedidos enviados", state.pedidos.length, "send"),
      ]),

      rankBlock("Productos más vistos", vistos),
      rankBlock("Productos más pedidos", pedidos),
      rankBlock("Origen de los consumidores (provincia)", origen),
      rankBlock("Rango etario (autodeclarado)", edades),
      rankBlock("Género (autodeclarado)", generos),
    );
  }

  reload();
  return root;
}
