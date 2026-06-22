import { h, icon } from "../../core/utils/dom.js";
import { getRef } from "./ref-localidad.js";
import { haversineKm } from "./domain/cercania.js";
import { totalCarrito, mensajeWhatsApp } from "./domain/carrito.js";
import { getCarrito, cambiarCantidad, quitarItem, quitarCarrito } from "./carrito-store.js";
import { getProductor } from "./feria-service.js";
import { registrarPedido } from "./pedidos-service.js";
import { session } from "../auth/auth-store.js";

function formatPrecio(value) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value ?? 0);
}

function waHref(whatsapp, mensaje) {
  const digits = String(whatsapp || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(mensaje)}`;
}

// Mis pedidos (route /pedidos, guarded to rol consumidor — doc §4.5). One saved
// cart per producer (doc §5.2). Editable quantities, referential total, and a
// "Pedir por WhatsApp" button that records the order intent (doc §10) and opens
// the pre-filled message (doc §5.3).
export async function misPedidosView({ navigate } = {}) {
  const sess = session.get();
  const ref = getRef() || sess?.profile?.localidadReferencia || null;
  const consumidor = sess?.profile?.nombre || sess?.user?.displayName || "";
  const uid = sess?.user?.uid;

  // Fetch each producer once (foto, whatsapp, coords) — not stored in the cart.
  const productores = {};
  await Promise.all(
    [...new Set(getCarrito().map((c) => c.productorId))].map(async (id) => {
      try { productores[id] = await getProductor(id); } catch { /* unapproved/offline */ }
    })
  );

  const enviados = new Set();
  const root = h("section", { class: "pedidos" });

  function paint() {
    const carts = getCarrito();
    if (carts.length === 0) {
      root.replaceChildren(emptyState(navigate));
      return;
    }
    root.replaceChildren(
      h("h1", { class: "display-heading", text: "Mis pedidos" }),
      h("p", { class: "section-subtitle", text: "Un pedido por productor. El total es referencial: coordinás todo por WhatsApp." }),
      ...carts.map((cart) => cartCard(cart))
    );
  }

  function cartCard(cart) {
    const prod = productores[cart.productorId];
    const loc = prod?.ubicacion?.localidad || cart.productorLocalidad;
    let distancia = null;
    if (ref?.lat != null && prod?.ubicacion?.lat != null) {
      const km = haversineKm({ lat: ref.lat, lng: ref.lng }, { lat: prod.ubicacion.lat, lng: prod.ubicacion.lng });
      distancia = km < 1 ? "menos de 1 km" : `a ${Math.round(km)} km`;
    }

    const header = h("div", { class: "pedido-head" }, [
      h("div", { class: "detalle-productor__avatar" },
        [prod?.portadaURL ? h("img", { src: prod.portadaURL, alt: cart.productorNombre }) : icon("plant-2")]),
      h("div", { class: "detalle-productor__info" }, [
        h("button", { class: "pedido-prod-name", type: "button", onclick: () => navigate(`/perfil/${cart.productorId}`), text: cart.productorNombre }),
        h("span", { class: "detalle-productor__loc" }, [
          icon("map-pin", "ti--xs"),
          [loc, distancia].filter(Boolean).join(" · "),
        ]),
      ]),
      h("button", { class: "icon-btn icon-btn--danger", type: "button", title: "Borrar pedido",
        onclick: () => { quitarCarrito(cart.productorId); paint(); } }, [icon("trash")]),
    ]);

    const items = cart.items.map((it) =>
      h("div", { class: "pedido-item" }, [
        h("div", { class: "pedido-item__info" }, [
          h("span", { class: "pedido-item__name", text: it.nombre }),
          h("span", { class: "pedido-item__price", text: `${formatPrecio(it.precio)}${it.unidad ? " /" + it.unidad : ""}` }),
        ]),
        h("div", { class: "stepper" }, [
          h("button", { class: "stepper__btn", type: "button", "aria-label": "Restar",
            onclick: () => { cambiarCantidad(cart.productorId, it.productoId, -1); paint(); } }, [icon("minus")]),
          h("span", { class: "stepper__count", text: String(it.cantidad) }),
          h("button", { class: "stepper__btn", type: "button", "aria-label": "Sumar",
            onclick: () => { cambiarCantidad(cart.productorId, it.productoId, +1); paint(); } }, [icon("plus")]),
        ]),
      ])
    );

    const total = totalCarrito(cart);
    const hasPhone = !!prod?.whatsapp;
    const enviado = enviados.has(cart.productorId);

    const waBtn = hasPhone
      ? h("a", {
          class: "btn btn--whatsapp btn--block",
          href: waHref(prod.whatsapp, mensajeWhatsApp(cart, { consumidor, localidad: ref?.localidad })),
          target: "_blank", rel: "noopener",
          onclick: () => {
            if (uid) registrarPedido(cart, uid).catch((e) => console.error("[pedido] registrar falló:", e?.code));
            enviados.add(cart.productorId);
            setTimeout(paint, 0); // let the link open first, then reflect "enviado"
          },
        }, [icon("brand-whatsapp"), "Pedir por WhatsApp"])
      : h("p", { class: "admin-muted", text: "No pudimos cargar el contacto de este productor." });

    return h("article", { class: "pedido-card" }, [
      header,
      h("div", { class: "pedido-items" }, items),
      h("div", { class: "pedido-foot" }, [
        h("span", { class: "pedido-total-label", text: "Total estimado" }),
        h("span", { class: "pedido-total", text: formatPrecio(total) }),
      ]),
      enviado ? h("div", { class: "estado-badge estado-badge--aprobado" }, [icon("circle-check"), h("span", { text: "Pedido enviado" })]) : null,
      waBtn,
    ]);
  }

  paint();
  return root;
}

function emptyState(navigate) {
  return h("div", { class: "pedidos-empty" }, [
    h("div", { class: "wizard-done__icon" }, [icon("basket")]),
    h("h1", { text: "Todavía no armaste ningún pedido" }),
    h("p", { class: "admin-muted", text: "Explorá la feria y agregá productos. Se agrupan por productor, listos para coordinar por WhatsApp." }),
    h("button", { class: "btn btn--primary btn--block", style: "margin-top:20px;", type: "button", onclick: () => navigate("/feria") },
      [icon("plant-2"), "Ir a la feria"]),
  ]);
}
