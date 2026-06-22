import { h, icon } from "../../core/utils/dom.js";
import { createProductCard } from "../../ui/components/product-card.js";
import { getProductor, listProductosDeProductor, listSellos } from "./feria-service.js";

// Builds a wa.me link from a raw phone number (digits only, no +). For the public
// profile the message is a simple greeting; the order-specific pre-filled message
// (doc §5.3) lives in "Mis pedidos" (bloque 5d).
function waLink(whatsapp, nombre) {
  const digits = String(whatsapp || "").replace(/\D/g, "");
  const msg = encodeURIComponent(`¡Hola ${nombre}! Te vi en Feria Raíces y quería consultarte.`);
  return `https://wa.me/${digits}?text=${msg}`;
}

// Public producer profile (route /productor/:uid, public — doc §4.5). Firestore
// rules only return producers with estado == 'aprobado' to visitors, so an
// unapproved producer reads as "not found" here.
export async function perfilView({ uid, navigate } = {}) {
  let productor = null, productos = [], sellos = [];
  try {
    [productor, sellos] = await Promise.all([getProductor(uid), listSellos()]);
    if (productor) productos = await listProductosDeProductor(uid);
  } catch (err) {
    console.error("[perfil] load falló:", err?.code, err);
  }

  if (!productor) {
    return h("section", {}, [
      backButton(navigate),
      h("p", { class: "admin-muted", style: "margin-top:24px;", text: "No encontramos este productor. Puede que su perfil no esté publicado." }),
    ]);
  }

  return renderPerfil(productor, { productos, sellos, navigate });
}

function backButton(navigate) {
  return h("button", { class: "wizard-back", type: "button", onclick: () => navigate("/feria") }, [
    icon("chevron-left"), "Volver a la feria",
  ]);
}

function renderPerfil(prod, { productos, sellos, navigate }) {
  const verificados = (prod.sellosVerificados || [])
    .map((id) => sellos.find((s) => s.id === id))
    .filter(Boolean);
  const loc = prod.ubicacion?.localidad
    ? `${prod.ubicacion.localidad}${prod.ubicacion.provincia ? ", " + prod.ubicacion.provincia : ""}`
    : null;

  return h("section", { class: "perfil" }, [
    backButton(navigate),

    h("div", { class: "perfil-cover" },
      [prod.portadaURL ? h("img", { src: prod.portadaURL, alt: prod.nombre }) : icon("plant-2")]),

    h("div", { class: "perfil-head" }, [
      h("h1", { class: "detalle-title", text: prod.nombre }),
      loc ? h("span", { class: "detalle-productor__loc" }, [icon("map-pin", "ti--xs"), loc]) : null,
      prod.cooperativa?.pertenece && prod.cooperativa.nombre
        ? h("span", { class: "perfil-coop" }, [icon("users", "ti--sm"), prod.cooperativa.nombre]) : null,
    ]),

    verificados.length ? sellosBlock(verificados) : null,

    prod.descripcion ? h("p", { class: "detalle-desc", text: prod.descripcion }) : null,

    redesBlock(prod.redes),
    prod.videos?.length ? videosBlock(prod.videos) : null,

    prod.whatsapp
      ? h("a", { class: "btn btn--whatsapp btn--block", href: waLink(prod.whatsapp, prod.nombre), target: "_blank", rel: "noopener" },
          [icon("brand-whatsapp"), "Escribir por WhatsApp"])
      : null,

    h("h2", { class: "detalle-subtitle", style: "margin-top:24px;", text: "Sus productos" }),
    productos.length
      ? h("div", { class: "product-grid" },
          productos.map((p) => createProductCard(p, { onOpen: (x) => navigate(`/producto/${x.id}`) })))
      : h("p", { class: "admin-muted", text: "Todavía no publicó productos." }),
  ]);
}

function sellosBlock(sellos) {
  return h("div", { class: "perfil-sellos" }, sellos.map((s) =>
    h("span", { class: "sello-badge", title: s.descripcion || s.nombre }, [
      s.logoURL ? h("img", { src: s.logoURL, alt: s.nombre }) : icon("rosette-discount-check"),
      h("span", { text: s.nombre }),
    ])));
}

function redesBlock(redes) {
  if (!redes) return null;
  const links = [];
  if (redes.instagram) links.push(["brand-instagram", redes.instagram]);
  if (redes.facebook) links.push(["brand-facebook", redes.facebook]);
  if (!links.length) return null;
  return h("div", { class: "perfil-redes" }, links.map(([ic, href]) =>
    h("a", { class: "icon-btn", href, target: "_blank", rel: "noopener" }, [icon(ic)])));
}

function videosBlock(videos) {
  return h("div", { class: "perfil-videos" }, [
    h("h2", { class: "detalle-subtitle", text: "Videos" }),
    ...videos.map((url) =>
      h("a", { class: "perfil-video", href: url, target: "_blank", rel: "noopener" },
        [icon("brand-youtube"), h("span", { text: "Ver video" })])),
  ]);
}
