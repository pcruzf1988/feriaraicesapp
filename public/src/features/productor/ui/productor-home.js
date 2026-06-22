import { h, icon } from "../../../core/utils/dom.js";
import { session } from "../../auth/auth-store.js";
import { getProfile } from "../productor-service.js";
import { altaWizard } from "./alta-wizard.js";

// Producer landing (route /productor, guarded to rol productor). Async view:
// no profile yet → show the alta wizard; otherwise → estado view.
export async function productorHome({ navigate } = {}) {
  const uid = session.get()?.user?.uid;
  let profile = null;
  try {
    if (uid) profile = await getProfile(uid);
  } catch (err) {
    console.error("[productor] getProfile falló:", err?.code, err);
  }

  if (!profile) return altaWizard({ navigate, uid });
  return estadoView(profile, navigate);
}

function estadoView(profile, navigate) {
  const aprobado = profile.estado === "aprobado";
  return h("section", { class: "productor-home" }, [
    h("h1", { class: "display-heading", text: `Hola, ${profile.nombre}` }),
    h("div", { class: `estado-badge estado-badge--${aprobado ? "aprobado" : "pendiente"}` }, [
      icon(aprobado ? "circle-check" : "clock"),
      h("span", { text: aprobado ? "Perfil aprobado" : "Tu perfil está en revisión" }),
    ]),
    h("p", { class: "admin-muted", text: aprobado
      ? "Tu perfil y tus productos están publicados en la feria. Mantené tu disponibilidad al día."
      : "Te avisamos cuando esté aprobado. Mientras tanto, ya podés ir cargando tus productos." }),
    h("button", { class: "btn btn--primary btn--block", style: "margin-top:20px;", onclick: () => navigate("/productor/productos") },
      [icon("basket"), "Mis productos"]),
    h("button", { class: "btn btn--ghost btn--block", style: "margin-top:10px;", onclick: () => navigate("/cuenta") },
      [icon("user"), "Mi cuenta"]),
  ]);
}
