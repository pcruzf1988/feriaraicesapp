import { h, icon } from "../../../core/utils/dom.js";
import { session } from "../../auth/auth-store.js";
import { getProfile, listSellos, updateProfile, uploadPortada } from "../productor-service.js";
import { buildPerfilPatch } from "../domain/perfil.js";
import { validateAltaEsencial } from "../domain/alta.js";
import { listRegions, listLocalities, PAISES, regionLabel } from "../../../core/utils/geo.js";

// Editar Mi perfil (route /productor/perfil, guarded — doc §4.5). Single form to
// enrich the profile after alta: cover, description, videos, social, cooperative,
// location and declared seals. Cannot touch estado/plan/sellosVerificados (rules);
// buildPerfilPatch guarantees that.
export async function miPerfilView({ navigate } = {}) {
  const uid = session.get()?.user?.uid;
  let profile = null, sellos = [];
  try {
    [profile, sellos] = await Promise.all([getProfile(uid), listSellos()]);
  } catch (err) {
    console.error("[mi-perfil] cargar falló:", err?.code, err);
  }
  if (!profile) {
    return h("section", {}, [h("p", { class: "admin-muted", text: "No encontramos tu perfil. Volvé a tu panel." })]);
  }

  const u = profile.ubicacion ?? {};
  const state = {
    sellos,
    data: {
      nombre: profile.nombre ?? "",
      descripcion: profile.descripcion ?? "",
      portadaURL: profile.portadaURL ?? "",
      videos: [...(profile.videos ?? [])],
      instagram: profile.redes?.instagram ?? "",
      facebook: profile.redes?.facebook ?? "",
      whatsapp: profile.whatsapp ?? "",
      coop: { pertenece: !!profile.cooperativa?.pertenece, nombre: profile.cooperativa?.nombre ?? "" },
      sellosDeclarados: [...(profile.sellosDeclarados ?? [])],
      pais: u.pais ?? PAISES[0],
      provincia: u.provincia ?? "",
      localidad: u.localidad ?? "",
      lat: u.lat ?? null,
      lng: u.lng ?? null,
    },
    regions: [],
    localities: [],
    loadingLocs: false,
    uploading: false,
    busy: false,
    saved: false,
    errors: {},
  };

  const root = h("section", { class: "wizard" });

  listRegions(state.data.pais).then((r) => { state.regions = r; paint(); }).catch(() => {});
  if (state.data.provincia) loadLocalities(state.data.provincia);

  async function loadLocalities(prov) {
    state.loadingLocs = true;
    paint();
    try { state.localities = await listLocalities(state.data.pais, prov); } catch (err) { console.error("[mi-perfil] localidades:", err); }
    state.loadingLocs = false;
    paint();
  }

  // Capture free-text inputs from the DOM before any state-changing re-render
  // (mirrors the alta wizard pattern so typing never loses focus).
  function readForm() {
    const get = (name) => root.querySelector(`[name="${name}"]`)?.value;
    for (const name of ["nombre", "whatsapp", "descripcion", "instagram", "facebook", "coopNombre"]) {
      const v = get(name);
      if (v != null) {
        if (name === "coopNombre") state.data.coop.nombre = v;
        else state.data[name] = v;
      }
    }
    // Keep every row (even blank) so inputs don't vanish mid-edit; buildPerfilPatch drops blanks on save.
    state.data.videos = state.data.videos.map((_, i) => get(`video-${i}`) ?? "");
  }

  function onProvinciaChange(value) {
    readForm();
    state.data.provincia = value;
    state.data.localidad = "";
    state.localities = [];
    if (value) loadLocalities(value); else paint();
  }

  function toggleSello(id) {
    readForm();
    const arr = state.data.sellosDeclarados;
    state.data.sellosDeclarados = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
    paint();
  }

  function addVideo() { readForm(); state.data.videos.push(""); paint(); }
  function removeVideo(i) { readForm(); state.data.videos.splice(i, 1); paint(); }

  async function onPickCover(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    readForm();
    state.uploading = true;
    paint();
    try {
      state.data.portadaURL = await uploadPortada(uid, file);
    } catch (err) {
      console.error("[mi-perfil] subir portada falló:", err?.code, err);
      alert("No se pudo subir la portada.");
    }
    state.uploading = false;
    paint();
  }

  async function save() {
    if (state.busy) return;
    readForm();
    const { valid, errors } = validateAltaEsencial(state.data);
    if (!valid) { state.errors = errors; paint(); return; }
    state.errors = {};
    state.busy = true;
    paint();
    try {
      const loc = state.localities.find((l) => l.nombre === state.data.localidad);
      const patch = buildPerfilPatch({
        ...state.data,
        coopPertenece: state.data.coop.pertenece,
        coopNombre: state.data.coop.nombre,
        lat: loc?.lat ?? state.data.lat,
        lng: loc?.lng ?? state.data.lng,
      });
      await updateProfile(uid, patch);
      state.busy = false;
      state.saved = true;
      paint();
    } catch (err) {
      console.error("[mi-perfil] guardar falló:", err?.code, err);
      state.errors = { _: "No pudimos guardar los cambios. Probá de nuevo." };
      state.busy = false;
      paint();
    }
  }

  function field(label, name, placeholder, type = "text") {
    return h("div", { class: "admin-field" }, [
      h("label", { class: "admin-field__label", text: label }),
      h("input", { class: "input", name, type, placeholder, value: state.data[name] }),
      state.errors[name] && h("div", { class: "admin-field__error", text: state.errors[name] }),
    ]);
  }

  function selectField(label, value, options, onChange, placeholder, error, disabled) {
    return h("div", { class: "admin-field" }, [
      h("label", { class: "admin-field__label", text: label }),
      h("select", { class: "input", disabled: disabled ? "true" : null, onchange: (e) => onChange(e.target.value) }, [
        h("option", { value: "", text: placeholder }),
        ...options.map((o) => h("option", { value: o, text: o, selected: value === o ? "selected" : null })),
      ]),
      error && h("div", { class: "admin-field__error", text: error }),
    ]);
  }

  function coverBlock() {
    return h("div", { class: "admin-field" }, [
      h("label", { class: "admin-field__label", text: "Portada" }),
      h("div", { class: "perfil-cover perfil-cover--edit" },
        [state.data.portadaURL ? h("img", { src: state.data.portadaURL, alt: "Portada" }) : icon("photo")]),
      h("label", { class: "btn btn--ghost btn--sm", style: "margin-top:8px;align-self:flex-start;" }, [
        icon(state.uploading ? "loader-2" : "upload"),
        state.uploading ? "Subiendo…" : (state.data.portadaURL ? "Cambiar portada" : "Subir portada"),
        h("input", { type: "file", accept: "image/*", style: "display:none;", onchange: onPickCover }),
      ]),
    ]);
  }

  function videosBlock() {
    return h("div", { class: "admin-field" }, [
      h("label", { class: "admin-field__label", text: "Videos (enlaces de YouTube)" }),
      ...state.data.videos.map((v, i) =>
        h("div", { class: "video-row" }, [
          h("input", { class: "input", name: `video-${i}`, type: "url", placeholder: "https://youtu.be/…", value: v }),
          h("button", { class: "icon-btn icon-btn--danger", type: "button", "aria-label": "Quitar video", onclick: () => removeVideo(i) }, [icon("trash")]),
        ])),
      h("button", { class: "btn btn--ghost btn--sm", type: "button", style: "align-self:flex-start;", onclick: addVideo }, [icon("plus"), "Agregar video"]),
    ]);
  }

  function sellosBlock() {
    return h("div", { class: "admin-field" }, [
      h("label", { class: "admin-field__label", text: "Sellos (los verifica el equipo de Raíces)" }),
      state.sellos.length === 0
        ? h("p", { class: "admin-muted", text: "No hay sellos disponibles por ahora." })
        : h("div", { class: "sello-list" },
            state.sellos.map((s) => {
              const on = state.data.sellosDeclarados.includes(s.id);
              const verificado = (profile.sellosVerificados ?? []).includes(s.id);
              return h("button", { class: `sello-item ${on ? "is-on" : ""}`, type: "button", onclick: () => toggleSello(s.id) }, [
                h("span", { class: `sello-check ${on ? "is-on" : ""}` }, on ? [icon("check")] : []),
                h("span", { text: s.nombre }),
                verificado ? h("span", { class: "sello-verif", text: "verificado" }) : null,
              ]);
            })),
    ]);
  }

  function coopBlock() {
    const coop = state.data.coop;
    return h("div", { class: "wizard-coop" }, [
      h("label", { class: "admin-field__label", text: "¿Integrás una cooperativa o grupo?" }),
      h("button", { class: `coop-toggle ${coop.pertenece ? "is-on" : ""}`, type: "button",
        onclick: () => { readForm(); coop.pertenece = !coop.pertenece; paint(); } },
        coop.pertenece ? "Sí, pertenezco" : "No"),
      coop.pertenece && h("input", { class: "input", name: "coopNombre", placeholder: "Nombre de la cooperativa", value: coop.nombre }),
    ]);
  }

  function paint() {
    if (state.saved) {
      root.replaceChildren(
        h("div", { class: "wizard-done" }, [
          h("div", { class: "wizard-done__icon" }, [icon("check")]),
          h("h1", { text: "Perfil actualizado" }),
          h("p", { class: "admin-muted", text: "Tus cambios ya están guardados." }),
          h("button", { class: "btn btn--primary btn--block", style: "margin-top:16px;", onclick: () => navigate("/productor") }, "Volver a mi panel"),
        ])
      );
      return;
    }

    const locPlaceholder = !state.data.provincia
      ? "Elegí primero la provincia"
      : state.loadingLocs ? "Cargando localidades…" : "Elegí tu localidad";

    root.replaceChildren(
      h("button", { class: "wizard-back", type: "button", onclick: () => navigate("/productor") }, [icon("arrow-left"), "Mi panel"]),
      h("h1", { text: "Editar mi perfil" }),
      field("Nombre del productor o familia", "nombre", "Ej. Huerta La Quebrada"),
      coverBlock(),
      h("div", { class: "admin-field" }, [
        h("label", { class: "admin-field__label", text: "Descripción" }),
        h("textarea", { class: "input", name: "descripcion", rows: "4", placeholder: "Quiénes son, qué producen, cómo lo hacen…" }, [state.data.descripcion]),
      ]),
      selectField(regionLabel(state.data.pais), state.data.provincia, state.regions, onProvinciaChange,
        state.regions.length ? "Elegí tu provincia" : "Cargando provincias…", state.errors.provincia),
      selectField("Localidad", state.data.localidad, state.localities.map((l) => l.nombre),
        (v) => { state.data.localidad = v; }, locPlaceholder, state.errors.localidad,
        !state.data.provincia || state.loadingLocs),
      field("WhatsApp", "whatsapp", "+54 9 388 …", "tel"),
      field("Instagram", "instagram", "@tu_cuenta"),
      field("Facebook", "facebook", "facebook.com/tu_pagina"),
      videosBlock(),
      coopBlock(),
      sellosBlock(),
      state.errors._ && h("div", { class: "auth-error", text: state.errors._ }),
      h("button", { class: "btn btn--primary btn--block", style: "margin-top:8px;", disabled: state.busy ? "true" : null, onclick: save },
        state.busy ? "Guardando…" : "Guardar cambios"),
    );
  }

  paint();
  return root;
}
