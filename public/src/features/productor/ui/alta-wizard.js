import { h, icon } from "../../../core/utils/dom.js";
import { validateAltaEsencial } from "../domain/alta.js";
import { listRegions, listLocalities, PAISES, regionLabel } from "../../../core/utils/geo.js";
import { listSellos, createProfile } from "../productor-service.js";

// Producer onboarding wizard (doc §4.5): minimal publishable profile + enrich later.
// Location is 100% declared (no GPS): the producer PICKS país → provincia →
// localidad from dependent dropdowns, and we read coordinates straight from the
// chosen locality (no typos, coords guaranteed). Country defaults to Argentina;
// the geo port is ready for Bolivia/Brasil (doc §7.1).
export function altaWizard({ navigate, uid } = {}) {
  const state = {
    step: 1,
    data: {
      nombre: "", pais: PAISES[0], provincia: "", localidad: "", whatsapp: "",
      descripcion: "", sellosDeclarados: [], coop: { pertenece: false, nombre: "" },
    },
    regions: [],
    localities: [],
    loadingLocs: false,
    sellos: [],
    errors: {},
    busy: false,
    done: false,
  };
  const root = h("section", { class: "wizard" });

  listRegions(state.data.pais).then((r) => { state.regions = r; if (state.step === 1) paint(); }).catch(() => {});
  listSellos().then((s) => { state.sellos = s; }).catch(() => {});

  // Read free-text fields back from the DOM (selects are tracked via onchange).
  const readText = () => {
    for (const name of ["nombre", "whatsapp", "descripcion"]) {
      const el = root.querySelector(`[name="${name}"]`);
      if (el) state.data[name] = el.value;
    }
  };

  async function onProvinciaChange(value) {
    state.data.provincia = value;
    state.data.localidad = "";
    state.localities = [];
    state.loadingLocs = Boolean(value);
    paint();
    if (!value) return;
    try {
      state.localities = await listLocalities(state.data.pais, value);
    } catch (err) {
      console.error("[alta] listLocalities falló:", err);
    }
    state.loadingLocs = false;
    paint();
  }

  function next() {
    readText();
    if (state.step === 1) {
      const { valid, errors } = validateAltaEsencial(state.data);
      if (!valid) { state.errors = errors; paint(); return; }
    }
    state.errors = {};
    state.step += 1;
    paint();
  }

  function back() { readText(); state.step -= 1; paint(); }

  function toggleSello(id) {
    const arr = state.data.sellosDeclarados;
    state.data.sellosDeclarados = arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
    paint();
  }

  async function finish() {
    if (state.busy) return;
    readText();
    state.busy = true; paint();
    try {
      const loc = state.localities.find((l) => l.nombre === state.data.localidad);
      await createProfile(uid, {
        nombre: state.data.nombre,
        pais: state.data.pais,
        provincia: state.data.provincia,
        localidad: state.data.localidad,
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
        whatsapp: state.data.whatsapp,
        descripcion: state.data.descripcion,
        sellosDeclarados: state.data.sellosDeclarados,
        cooperativa: state.data.coop.pertenece
          ? { pertenece: true, nombre: state.data.coop.nombre }
          : { pertenece: false },
      });
      state.done = true; state.busy = false; paint();
    } catch (err) {
      console.error("[alta] createProfile falló:", err?.code, err);
      state.errors = { _: "No pudimos crear tu perfil. Probá de nuevo." };
      state.busy = false; paint();
    }
  }

  function textField(label, name, placeholder, type = "text") {
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

  function progress() {
    return h("div", { class: "wizard-progress" }, [1, 2, 3].map((n) => h("span", { class: state.step >= n ? "on" : "" })));
  }

  function helpBtn() {
    return h("a", {
      class: "wizard-help",
      href: "https://wa.me/5493884000000?text=Necesito%20ayuda%20con%20mi%20alta%20en%20Feria%20Ra%C3%ADces",
      target: "_blank", rel: "noopener",
    }, [icon("brand-whatsapp"), "Necesito ayuda"]);
  }

  function paint() {
    if (state.done) {
      root.replaceChildren(
        h("div", { class: "wizard-done" }, [
          h("div", { class: "wizard-done__icon" }, [icon("check")]),
          h("h1", { text: "¡Listo!" }),
          h("p", { class: "admin-muted", text: "Tu perfil quedó en revisión. Te avisamos cuando esté aprobado. Mientras tanto, ya podés ir cargando tus productos." }),
          h("button", { class: "btn btn--primary btn--block", style: "margin-top:16px;", onclick: () => navigate("/productor") }, "Ir a mi panel"),
          helpBtn(),
        ])
      );
      return;
    }

    let body;
    if (state.step === 1) {
      const locPlaceholder = !state.data.provincia
        ? "Elegí primero la provincia"
        : state.loadingLocs
          ? "Cargando localidades…"
          : "Elegí tu localidad";
      body = h("div", {}, [
        h("h1", { text: "Empecemos por lo básico" }),
        textField("Nombre del productor o familia", "nombre", "Ej. Huerta La Quebrada"),
        selectField(
          regionLabel(state.data.pais),
          state.data.provincia,
          state.regions,
          onProvinciaChange,
          state.regions.length ? "Elegí tu provincia" : "Cargando provincias…",
          state.errors.provincia
        ),
        selectField(
          "Localidad (donde producís)",
          state.data.localidad,
          state.localities.map((l) => l.nombre),
          (v) => { state.data.localidad = v; },
          locPlaceholder,
          state.errors.localidad,
          !state.data.provincia || state.loadingLocs
        ),
        textField("WhatsApp", "whatsapp", "+54 9 388 …", "tel"),
        state.errors._ && h("div", { class: "auth-error", text: state.errors._ }),
        h("button", { class: "btn btn--primary btn--block", style: "margin-top:8px;", onclick: next }, "Siguiente"),
        helpBtn(),
      ]);
    } else if (state.step === 2) {
      body = h("div", {}, [
        h("h1", { text: "Mostrá quién sos" }),
        h("p", { class: "wizard-step-note", text: "Paso opcional — lo podés completar después." }),
        h("div", { class: "admin-field" }, [
          h("label", { class: "admin-field__label", text: "Contanos en pocas palabras" }),
          h("textarea", { class: "input", name: "descripcion", rows: "4", placeholder: "Quiénes son, qué producen, cómo lo hacen…" }, [state.data.descripcion]),
        ]),
        h("button", { class: "btn btn--primary btn--block", onclick: next }, "Siguiente"),
        h("button", { class: "btn btn--ghost btn--block", style: "margin-top:8px;", onclick: next }, "Lo hago más tarde"),
      ]);
    } else {
      const coop = state.data.coop;
      body = h("div", {}, [
        h("h1", { text: "¿Tenés algún sello?" }),
        h("p", { class: "wizard-step-note", text: "Opcional. El equipo de Raíces verificará los que marques." }),
        h("div", { class: "sello-list" },
          state.sellos.length === 0
            ? [h("p", { class: "admin-muted", text: "No hay sellos disponibles por ahora." })]
            : state.sellos.map((s) => {
                const on = state.data.sellosDeclarados.includes(s.id);
                return h("button", { class: `sello-item ${on ? "is-on" : ""}`, type: "button", onclick: () => toggleSello(s.id) }, [
                  h("span", { class: `sello-check ${on ? "is-on" : ""}` }, on ? [icon("check")] : []),
                  h("span", { text: s.nombre }),
                ]);
              })
        ),
        h("div", { class: "wizard-coop" }, [
          h("label", { class: "admin-field__label", text: "¿Integrás una cooperativa o grupo?" }),
          h("button", { class: `coop-toggle ${coop.pertenece ? "is-on" : ""}`, type: "button", onclick: () => { coop.pertenece = !coop.pertenece; paint(); } },
            coop.pertenece ? "Sí, pertenezco" : "No"),
          coop.pertenece && h("input", { class: "input", placeholder: "Nombre de la cooperativa", value: coop.nombre, oninput: (e) => { coop.nombre = e.target.value; } }),
        ]),
        state.errors._ && h("div", { class: "auth-error", text: state.errors._ }),
        h("button", { class: "btn btn--primary btn--block", style: "margin-top:8px;", disabled: state.busy ? "true" : null, onclick: finish }, state.busy ? "Creando tu perfil…" : "Finalizar"),
      ]);
    }

    root.replaceChildren(
      h("div", { class: "wizard-head" }, [
        progress(),
        h("div", { class: "wizard-step-label", text: `Paso ${state.step} de 3${state.step > 1 ? " · opcional" : ""}` }),
      ]),
      state.step > 1 ? h("button", { class: "wizard-back", type: "button", onclick: back }, [icon("arrow-left"), "Atrás"]) : null,
      body
    );
  }

  paint();
  return root;
}
