# Recetas públicas — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la cara pública de Recetas (listado + ficha) con portada y video opcionales, cerrando el placeholder de `/recetas`.

**Architecture:** Screaming + hexagonal, vanilla JS sin build. Lógica de dominio pura testeada (Vitest); adaptadores Firestore/Storage y vistas DOM se verifican con `node --check` + manual. Se reusa el patrón del feature `feria` (servicio + vistas) y del CRUD genérico de admin.

**Tech Stack:** JS módulos ES, Firebase 12.15.0 (Firestore + Storage por CDN gstatic), Vitest, helper `h`/`icon` de `core/utils/dom.js`.

## Global Constraints

- Commits conventional, SIN atribución IA.
- Strict TDD solo en dominio puro; vistas/adaptadores → `node --check` + manual.
- Inputs no-controlados: leer del DOM antes de repaint para no perder foco/valores.
- Firebase se importa por URL CDN gstatic (no npm).
- El vínculo producto↔receta vive solo en `recetas.productosCompatibles` (única fuente de verdad).
- Test runner: `npm test`. Parse check: `node --check <archivo>`.

---

### Task 1: Dominio puro de recetas (TDD)

**Files:**
- Create: `public/src/features/feria/domain/recetas.js`
- Test: `public/src/features/feria/domain/recetas.test.js`

**Interfaces:**
- Produces:
  - `productosCompatiblesVisibles(receta, productos) -> Producto[]` — filtra `productos` a los que están en `receta.productosCompatibles` y tienen `productorAprobado === true`, preservando el orden de `productosCompatibles`.
  - `pasosLimpios(instrucciones) -> string[]` — recorta y descarta líneas vacías.

- [ ] **Step 1: Write the failing test**

```js
// public/src/features/feria/domain/recetas.test.js
import { describe, it, expect } from "vitest";
import { productosCompatiblesVisibles, pasosLimpios } from "./recetas.js";

describe("productosCompatiblesVisibles", () => {
  const receta = { productosCompatibles: ["a", "b", "c"] };

  it("devuelve solo los aprobados, en el orden de productosCompatibles", () => {
    const productos = [
      { id: "b", productorAprobado: true, nombrePrincipal: "B" },
      { id: "a", productorAprobado: true, nombrePrincipal: "A" },
    ];
    expect(productosCompatiblesVisibles(receta, productos).map((p) => p.id)).toEqual(["a", "b"]);
  });

  it("excluye no aprobados", () => {
    const productos = [
      { id: "a", productorAprobado: false },
      { id: "b", productorAprobado: true },
    ];
    expect(productosCompatiblesVisibles(receta, productos).map((p) => p.id)).toEqual(["b"]);
  });

  it("excluye los que no existen entre los traídos", () => {
    const productos = [{ id: "a", productorAprobado: true }];
    expect(productosCompatiblesVisibles(receta, productos).map((p) => p.id)).toEqual(["a"]);
  });

  it("array vacío si no hay compatibles o falta el campo", () => {
    expect(productosCompatiblesVisibles({ productosCompatibles: [] }, [])).toEqual([]);
    expect(productosCompatiblesVisibles({}, [])).toEqual([]);
  });
});

describe("pasosLimpios", () => {
  it("recorta y descarta líneas vacías", () => {
    expect(pasosLimpios(["  Rallá  ", "", "   ", "Rehogá"])).toEqual(["Rallá", "Rehogá"]);
  });

  it("[] si no hay instrucciones", () => {
    expect(pasosLimpios(undefined)).toEqual([]);
    expect(pasosLimpios([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- recetas`
Expected: FAIL — `recetas.js` no existe / funciones no definidas.

- [ ] **Step 3: Write minimal implementation**

```js
// public/src/features/feria/domain/recetas.js
// Pure helpers for the public recipes feature (doc §4.4 / §4.5).

// Returns the products that the recipe links to AND are currently visible
// (existing among the fetched ones + productorAprobado), preserving the order
// declared in receta.productosCompatibles.
export function productosCompatiblesVisibles(receta, productos) {
  const ids = receta?.productosCompatibles ?? [];
  const byId = new Map((productos ?? []).map((p) => [p.id, p]));
  return ids
    .map((id) => byId.get(id))
    .filter((p) => p && p.productorAprobado === true);
}

// Trims instruction lines and drops empty ones.
export function pasosLimpios(instrucciones) {
  return (instrucciones ?? []).map((s) => String(s).trim()).filter(Boolean);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- recetas`
Expected: PASS (todos los casos).

- [ ] **Step 5: Commit**

```bash
git add public/src/features/feria/domain/recetas.js public/src/features/feria/domain/recetas.test.js
git commit -m "feat: pure domain for public recipes (visible products + clean steps)"
```

---

### Task 2: Lecturas de recetas en el servicio

**Files:**
- Modify: `public/src/features/feria/feria-service.js`

**Interfaces:**
- Consumes: `db`, `collection`, `getDocs`, `getDoc`, `doc` (ya importados en el archivo).
- Produces:
  - `listRecetas() -> Promise<Receta[]>`
  - `getReceta(id) -> Promise<Receta|null>`

- [ ] **Step 1: Add the two reads**

Agregar al final de `feria-service.js` (antes de `contarVista` o tras `listSellos`):

```js
// --- Recetas públicas (doc §4.5). Lectura pública por reglas. ---

export async function listRecetas() {
  const snap = await getDocs(collection(db, "recetas"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getReceta(id) {
  const snap = await getDoc(doc(db, "recetas", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
```

- [ ] **Step 2: Parse check**

Run: `node --check public/src/features/feria/feria-service.js`
Expected: sin salida (OK).

- [ ] **Step 3: Commit**

```bash
git add public/src/features/feria/feria-service.js
git commit -m "feat: listRecetas + getReceta reads in feria service"
```

---

### Task 3: Storage — regla + subida de portada de receta

**Files:**
- Modify: `storage.rules`
- Modify: `public/src/features/admin/admin-service.js`

**Interfaces:**
- Produces: `uploadRecetaImagen(file) -> Promise<string>` (download URL).

- [ ] **Step 1: Add the Storage rule**

En `storage.rules`, después del bloque `match /sellos/{file=**}`:

```
    // Recipe cover images: admin-managed.
    match /recetas/{file=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
```

- [ ] **Step 2: Add the uploader to admin-service.js**

Agregar imports de Storage arriba (junto a los de Firestore):

```js
import { storage } from "../../core/firebase/firebase.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";
```

Y al final del archivo:

```js
// Upload a recipe cover to Storage (/recetas/...) and return its public URL.
// Mirrors uploadPortada in productor-service.
export async function uploadRecetaImagen(file) {
  const safe = file.name.replace(/[^\w.\-]/g, "_");
  const r = ref(storage, `recetas/${Date.now()}_${safe}`);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}
```

- [ ] **Step 3: Parse check**

Run: `node --check public/src/features/admin/admin-service.js`
Expected: sin salida (OK).

- [ ] **Step 4: Deploy Storage rules (necesario para probar la subida en Task 4)**

Run: `npx firebase-tools deploy --only storage --project feria-raices-app`
Expected: `Deploy complete!`

- [ ] **Step 5: Commit**

```bash
git add storage.rules public/src/features/admin/admin-service.js
git commit -m "feat: recipe cover upload to Storage + admin write rule"
```

---

### Task 4: Campo "image" en el CRUD genérico + config de recetas

**Files:**
- Modify: `public/src/features/admin/ui/crud-section.js`
- Modify: `public/src/features/admin/ui/admin-view.js`

**Interfaces:**
- Consumes: `uploadRecetaImagen` (Task 3), `icon` de dom.js.
- Field config nuevo: `{ name, label, type: "image", upload: (file) => Promise<url> }`.

- [ ] **Step 1: Import `icon` if needed and add image handling to crud-section.js**

`crud-section.js` ya importa `{ h, icon }`. Agregar `uploadingField: null` al `state` inicial:

```js
const state = { items: [], loading: true, editingId: null, form: {}, errors: {}, busy: false, uploadingField: null };
```

Reemplazar `readForm` para que los campos image lean su URL desde `state.form`:

```js
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
```

Agregar un helper para preservar lo tipeado al repintar tras subir (patrón inputs no-controlados):

```js
  function syncFormFromDom() {
    for (const f of fields) {
      if (f.type === "image") continue; // su valor vive en state.form, no en el input file
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
```

En `renderField`, manejar el tipo image antes del bloque genérico:

```js
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
```

Nota: `openForm` ya hace `state.form[f.name] = docToField(f, item[f.name])`; para image `docToField` cae en el default (`value ?? ""`) y guarda la URL string. OK sin cambios.

- [ ] **Step 2: Wire recipe fields in admin-view.js**

Importar el uploader arriba de `admin-view.js`:

```js
import { uploadRecetaImagen } from "../admin-service.js";
```

Reemplazar los `fields` del case `"recetas"`:

```js
        fields: [
          { name: "titulo", label: "Título", type: "text", placeholder: "Ej. Humita en chala" },
          { name: "descripcion", label: "Descripción", type: "textarea", placeholder: "De qué trata la receta" },
          { name: "portadaURL", label: "Portada (opcional)", type: "image", upload: uploadRecetaImagen },
          { name: "video", label: "Video de YouTube (opcional)", type: "text", placeholder: "https://youtu.be/…" },
          { name: "instrucciones", label: "Pasos (uno por línea)", type: "lines", placeholder: "Rallá el maíz…\nRehogá la cebolla…" },
        ],
```

- [ ] **Step 3: Parse check**

Run: `node --check public/src/features/admin/ui/crud-section.js && node --check public/src/features/admin/ui/admin-view.js`
Expected: sin salida (OK).

- [ ] **Step 4: Manual verify (tras deploy en Task 8, o con `npm run serve`)**

En `/admin` → Recetas → Agregar: subir una portada (aparece preview), pegar un link de YouTube, guardar. Editar: la portada y el video persisten.

- [ ] **Step 5: Commit**

```bash
git add public/src/features/admin/ui/crud-section.js public/src/features/admin/ui/admin-view.js
git commit -m "feat: image field in admin CRUD + recipe cover/video fields"
```

---

### Task 5: Listado público `/recetas`

**Files:**
- Create: `public/src/features/feria/recetas-view.js`
- Modify: `public/src/main.js`
- Modify: `public/src/styles/components.css`

**Interfaces:**
- Consumes: `listRecetas` (Task 2).
- Produces: `recetasView({ navigate }) -> HTMLElement`.

- [ ] **Step 1: Create the list view**

```js
// public/src/features/feria/recetas-view.js
import { h, icon } from "../../core/utils/dom.js";
import { listRecetas } from "./feria-service.js";

// Recetas — public list (doc §4.5). Each card links to /receta/:id.
export function recetasView({ navigate } = {}) {
  const root = h("section", { class: "recetas" });
  const grid = h("div", { class: "recetas-list" });
  root.replaceChildren(
    h("h1", { class: "recetas__title", text: "Recetas con identidad" }),
    grid,
  );
  grid.replaceChildren(h("p", { class: "admin-muted", text: "Cargando recetas…" }));

  (async function load() {
    let recetas = [];
    try {
      recetas = await listRecetas();
    } catch (err) {
      console.error("[recetas] load falló:", err?.code, err);
    }
    if (!recetas.length) {
      grid.replaceChildren(h("p", { class: "admin-muted", text: "Todavía no hay recetas." }));
      return;
    }
    grid.replaceChildren(...recetas.map(card));
  })();

  function card(r) {
    return h("button", { class: "receta-card", type: "button", onclick: () => navigate(`/receta/${r.id}`) }, [
      h("div", { class: "receta-card__media" }, [
        r.portadaURL ? h("img", { src: r.portadaURL, alt: r.titulo }) : icon("chef-hat"),
      ]),
      h("div", { class: "receta-card__body" }, [
        h("div", { class: "receta-card__title", text: r.titulo }),
        r.descripcion ? h("div", { class: "receta-card__desc", text: r.descripcion }) : null,
      ]),
    ]);
  }

  return root;
}
```

- [ ] **Step 2: Wire the route in main.js**

Agregar import (junto a los otros de feria):

```js
import { recetasView } from "./features/feria/recetas-view.js";
```

Reemplazar la ruta `/recetas` (que hoy es placeholder):

```js
  "/recetas": () => recetasView({ navigate }),
```

- [ ] **Step 3: Add CSS**

Agregar al final de `components.css` (ajustar nombres de tokens a los existentes en `design-tokens.css` si alguno difiere):

```css
/* ---- Recetas (listado público) ---- */
.recetas__title {
  font-family: var(--font-display);
  font-size: var(--fs-xl);
  color: var(--color-verde);
  margin-bottom: var(--sp-3);
}
.recetas-list {
  display: flex;
  flex-direction: column;
  gap: var(--sp-3);
}
.receta-card {
  display: flex;
  gap: var(--sp-3);
  align-items: center;
  text-align: left;
  width: 100%;
  background: var(--color-surface);
  border: 0.5px solid var(--color-line);
  border-radius: 14px;
  padding: var(--sp-2);
}
.receta-card__media {
  width: 64px;
  height: 64px;
  flex-shrink: 0;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-crema);
  color: var(--color-oliva);
}
.receta-card__media img { width: 100%; height: 100%; object-fit: cover; }
.receta-card__title { font-weight: var(--fw-semibold); color: var(--color-cacao); }
.receta-card__desc {
  font-size: var(--fs-sm);
  color: var(--color-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

- [ ] **Step 4: Parse check**

Run: `node --check public/src/features/feria/recetas-view.js && node --check public/src/main.js`
Expected: sin salida (OK).

- [ ] **Step 5: Commit**

```bash
git add public/src/features/feria/recetas-view.js public/src/main.js public/src/styles/components.css
git commit -m "feat: public recipes list at /recetas"
```

---

### Task 6: Ficha de receta `/receta/:id`

**Files:**
- Create: `public/src/features/feria/receta-view.js`
- Modify: `public/src/main.js`
- Modify: `public/src/styles/components.css`

**Interfaces:**
- Consumes: `getReceta`, `getProducto` (servicio), `productosCompatiblesVisibles`, `pasosLimpios` (Task 1).
- Produces: `recetaView({ id, navigate }) -> Promise<HTMLElement>`.

- [ ] **Step 1: Create the detail view**

```js
// public/src/features/feria/receta-view.js
import { h, icon } from "../../core/utils/dom.js";
import { getReceta, getProducto } from "./feria-service.js";
import { productosCompatiblesVisibles, pasosLimpios } from "./domain/recetas.js";

// Ficha de receta (route /receta/:id, public — doc §4.5).
export async function recetaView({ id, navigate } = {}) {
  let receta = null, productos = [];
  try {
    receta = await getReceta(id);
    if (receta?.productosCompatibles?.length) {
      const fetched = await Promise.all(receta.productosCompatibles.map(getProducto));
      productos = productosCompatiblesVisibles(receta, fetched.filter(Boolean));
    }
  } catch (err) {
    console.error("[receta] load falló:", err?.code, err);
  }

  if (!receta) {
    return h("section", {}, [
      backButton(navigate),
      h("p", { class: "admin-muted", style: "margin-top:24px;", text: "No encontramos esta receta." }),
    ]);
  }
  return renderReceta(receta, productos, navigate);
}

function backButton(navigate) {
  return h("button", { class: "wizard-back", type: "button", onclick: () => navigate("/recetas") }, [
    icon("chevron-left"), "Volver a recetas",
  ]);
}

function renderReceta(r, productos, navigate) {
  const pasos = pasosLimpios(r.instrucciones);
  return h("section", { class: "detalle" }, [
    backButton(navigate),
    r.portadaURL ? h("div", { class: "receta-hero" }, [h("img", { src: r.portadaURL, alt: r.titulo })]) : null,
    h("div", { class: "detalle-head" }, [h("h1", { class: "detalle-title", text: r.titulo })]),
    r.descripcion ? h("p", { class: "detalle-desc", text: r.descripcion }) : null,
    r.video
      ? h("a", { class: "perfil-video", href: r.video, target: "_blank", rel: "noopener" },
          [icon("brand-youtube"), h("span", { text: "Ver video" })])
      : null,
    pasos.length ? pasosBlock(pasos) : null,
    productos.length ? productosBlock(productos, navigate) : null,
  ]);
}

function pasosBlock(pasos) {
  return h("div", { class: "receta-pasos" }, [
    h("h2", { class: "detalle-subtitle", text: "Pasos" }),
    h("ol", { class: "receta-pasos__list" }, pasos.map((p) => h("li", { text: p }))),
  ]);
}

function productosBlock(productos, navigate) {
  return h("div", { class: "detalle-recetas" }, [
    h("h2", { class: "detalle-subtitle", text: "Se usa en estos productos" }),
    h("div", { class: "chip-row" }, productos.map((p) =>
      h("button", { class: "chip", type: "button", onclick: () => navigate(`/producto/${p.id}`) },
        [icon("basket", "ti--sm"), p.nombrePrincipal]))),
  ]);
}
```

- [ ] **Step 2: Wire the route in main.js**

Agregar import:

```js
import { recetaView } from "./features/feria/receta-view.js";
```

Agregar la ruta (cerca de `/producto/:id`):

```js
  "/receta/:id": ({ params }) => recetaView({ id: params.id, navigate }),
```

- [ ] **Step 3: Add CSS**

Agregar a `components.css`:

```css
/* ---- Receta (ficha) ---- */
.receta-hero {
  border-radius: 14px;
  overflow: hidden;
}
.receta-hero img {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
}
.receta-pasos__list {
  margin: var(--sp-2) 0 0 var(--sp-4);
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
}
```

- [ ] **Step 4: Parse check**

Run: `node --check public/src/features/feria/receta-view.js && node --check public/src/main.js`
Expected: sin salida (OK).

- [ ] **Step 5: Commit**

```bash
git add public/src/features/feria/receta-view.js public/src/main.js public/src/styles/components.css
git commit -m "feat: recipe detail at /receta/:id (cover, video, steps, linked products)"
```

---

### Task 7: Chips de receta clickeables en la ficha de producto

**Files:**
- Modify: `public/src/features/feria/ficha-view.js`

**Interfaces:**
- Consumes: `navigate` (ya disponible en `renderFicha`).

- [ ] **Step 1: Pass navigate to recetasBlock and make chips clickable**

En `renderFicha`, cambiar la línea:

```js
    recetas.length ? recetasBlock(recetas) : null,
```

por:

```js
    recetas.length ? recetasBlock(recetas, navigate) : null,
```

Reemplazar `recetasBlock`:

```js
function recetasBlock(recetas, navigate) {
  return h("div", { class: "detalle-recetas" }, [
    h("h2", { class: "detalle-subtitle", text: "Se puede usar en estas recetas" }),
    h("div", { class: "chip-row" }, recetas.map((r) =>
      h("button", { class: "chip", type: "button", onclick: () => navigate(`/receta/${r.id}`) },
        [icon("chef-hat", "ti--sm"), r.titulo]))),
  ]);
}
```

- [ ] **Step 2: Parse check + full suite (no romper nada)**

Run: `node --check public/src/features/feria/ficha-view.js && npm test`
Expected: parse OK; **todos** los tests verdes (101 previos + 6 nuevos de Task 1 = 107).

- [ ] **Step 3: Commit**

```bash
git add public/src/features/feria/ficha-view.js
git commit -m "feat: recipe chips on product detail link to /receta/:id"
```

---

### Task 8: Deploy + verificación en vivo

**Files:**
- Modify: `public/service-worker.js`

- [ ] **Step 1: Bump the SW cache version**

En `public/service-worker.js`: `const CACHE_VERSION = "feria-raices-v18";` (era v17).

- [ ] **Step 2: Parse check**

Run: `node --check public/service-worker.js`
Expected: sin salida (OK).

- [ ] **Step 3: Deploy hosting**

Run: `npx firebase-tools deploy --only hosting --project feria-raices-app`
Expected: `Deploy complete!`

- [ ] **Step 4: Verificación manual en vivo**

1. `/admin` → Recetas → crear una receta con portada (subida), video de YouTube, 2-3 productos compatibles, varios pasos.
2. `/recetas` → la tarjeta aparece con miniatura; al tocarla abre `/receta/:id`.
3. En la ficha: portada arriba, "Ver video" abre YouTube, pasos numerados, chips de producto navegan a `/producto/:id`.
4. En un `/producto/:id` que esté en `productosCompatibles`: el chip de receta ahora navega a `/receta/:id`.

- [ ] **Step 5: Commit**

```bash
git add public/service-worker.js
git commit -m "chore: bump SW cache to v18 for recipes section"
git push origin main
```

---

## Self-Review

- **Cobertura del spec:** modelo (portadaURL/video → Task 4) · dominio (Task 1) · servicio reads (Task 2) · Storage rule + upload (Task 3) · admin CRUD image (Task 4) · listado (Task 5) · ficha (Task 6) · chips clickeables (Task 7) · deploy (Task 8). Sin huecos.
- **Placeholders:** ninguno; todo el código está completo. La única nota abierta es "ajustar nombres de tokens CSS si difieren" — los tokens usados (`--color-surface`, `--color-line`, `--color-crema`, `--color-oliva`, `--color-cacao`, `--color-muted`, `--color-verde`, `--font-display`, `--fs-xl`, `--fs-sm`, `--fw-semibold`, `--sp-2/3/4`) ya se usan en `components.css`; verificar contra `design-tokens.css` al implementar.
- **Consistencia de tipos:** `productosCompatiblesVisibles`/`pasosLimpios` se definen en Task 1 y se consumen idénticos en Task 6. `uploadRecetaImagen` se define en Task 3 y se consume en Task 4. `listRecetas`/`getReceta` Task 2 → Tasks 5/6.
