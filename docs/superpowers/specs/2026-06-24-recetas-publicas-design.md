# Recetas públicas — diseño

Fecha: 2026-06-24
Bloque: §13 / backlog #1 (cierra el placeholder de `/recetas`)

## Objetivo

Construir la cara pública de Recetas (doc maestro §4.4 y §4.5): un listado navegable
y una ficha de receta con descripción, pasos, productos compatibles enlazados, y
—como agregado de esta versión— portada opcional y video de YouTube opcional.

El modelo de datos y el CRUD de admin ya existen. Falta la UI pública, dos campos
nuevos en el modelo, y la subida de imagen para la portada.

## Alcance

Incluye:
- `/recetas` — listado de tarjetas (miniatura de portada si hay, título, descripción).
- `/receta/:id` — ficha: portada (si hay), título, descripción, link "Ver video"
  (si hay), pasos numerados, "Se usa en estos productos" con chips que enlazan a
  `/producto/:id`. Estado "no encontrada" si la receta no existe.
- Chips de receta en la ficha de producto pasan a ser clickeables → `/receta/:id`.
- Dos campos opcionales nuevos en `recetas/{id}`: `portadaURL` y `video`.
- Subida de portada desde el dispositivo (Storage), cargada por admin.

Fuera de alcance (YAGNI): buscador/filtro de recetas, contador de vistas de receta.

## Modelo de datos

`recetas/{id}` (doc §8):
```
{ titulo, descripcion, instrucciones[], productosCompatibles[],
  portadaURL?, video?, vistas? }
```
Se suman `portadaURL` (string, URL de Storage) y `video` (string, URL de YouTube),
ambos opcionales. El vínculo producto↔receta sigue viviendo solo en
`productosCompatibles` (única fuente de verdad).

## Componentes

### Dominio puro (TDD, Vitest)
`public/src/features/feria/domain/recetas.js`:
- `productosCompatiblesVisibles(receta, productos)` — dado el array de productos ya
  traído, devuelve solo los que están en `receta.productosCompatibles`, existen, y
  tienen `productorAprobado === true`. Preserva el orden de `productosCompatibles`.
- `pasosLimpios(instrucciones)` — descarta líneas vacías / solo-espacios; devuelve `[]`
  si no hay.

Portada y video no llevan lógica de dominio (strings opcionales; el trim lo hace el
CRUD al guardar).

### Servicio (adaptador Firestore — no unit-test, `node --check` + manual)
`public/src/features/feria/feria-service.js` suma:
- `listRecetas()` — lee la colección `recetas` (lectura pública).
- `getReceta(id)` — un doc o `null`.
- Resolución de compatibles: en la vista de detalle se traen los productos por ID
  (`Promise.all` de `getProducto`) y se filtran con `productosCompatiblesVisibles`.

### Storage (subida de portada)
- `storage.rules`: regla nueva
  `match /recetas/{file=**} { allow read: if true; allow write: if isAdmin(); }`.
  Deploy de reglas de Storage.
- `public/src/features/admin/admin-service.js`: `uploadRecetaImagen(file)` → sube a
  `recetas/${Date.now()}_${safe}` y devuelve `getDownloadURL`. Mismo patrón que
  `uploadPortada` del productor.

### Admin CRUD (`crud-section.js`, genérico)
Se agrega un tipo de campo `"image"`:
- Render: preview de la imagen actual (si `state.form[name]`) + input file + botón/
  label "Subir imagen" (o "Cambiar"). Estado "Subiendo…" mientras sube.
- Al elegir archivo: llama al uploader provisto por la config del campo
  (`field.upload`), guarda la URL devuelta en `state.form[name]`, repinta.
- `readForm`: para campos `image` toma el valor de `state.form[name]` (la URL), no el
  `value` del input file. Para los demás tipos, sin cambios.
- `fieldToDoc`/`docToField`: `image` se comporta como string (URL) — guarda el trim.

Config de recetas (`admin-view.js`) pasa a:
`titulo` (text) · `descripcion` (textarea) · `portadaURL` (image, opcional) ·
`video` (text/url, opcional) · `instrucciones` (lines).

`validateReceta` no cambia: solo `titulo` obligatorio; portada y video opcionales.

### Vistas (DOM — `node --check` + manual)
- `public/src/features/feria/recetas-view.js` (`/recetas`): tarjetas. Lista vacía →
  "Todavía no hay recetas." Falla de fetch → log + estado vacío (patrón feria).
- `public/src/features/feria/receta-view.js` (`/receta/:id`): patrón de `ficha-view`
  (loading → fetch → render | no-encontrada). Video como link "Ver video"
  (patrón `perfil-view` `videosBlock`). Chips de producto → `navigate("/producto/"+id)`.

### Rutas (`main.js`)
- `/recetas` → `recetasView` (reemplaza `placeholderView`).
- `/receta/:id` → `recetaView` (nueva, con `:id` como param, igual que `/producto/:id`).

### Ficha de producto (`ficha-view.js`)
`recetasBlock(recetas, navigate)` — los chips pasan a `button`/clickeable →
`navigate("/receta/" + r.id)`. Se pasa `navigate` desde `renderFicha`.

### CSS (`components.css`)
Reuso de `chip`, `chip-row`, `detalle-subtitle`, estilos de tarjeta existentes.
Mínimo CSS nuevo: imagen hero de la receta y miniatura en la tarjeta del listado.

## Flujo de datos

- `/recetas`: `recetasView` → `listRecetas()` → tarjetas; cada una navega a `/receta/:id`.
- `/receta/:id`: `recetaView` → `getReceta(id)`; si existe, `Promise.all(getProducto)`
  sobre `productosCompatibles` → `productosCompatiblesVisibles` → render. Si `null`,
  estado "Receta no encontrada".
- Admin guarda receta: subir portada (opcional) → URL → `createDoc`/`updateDocById`.

## Manejo de errores

- Listado vacío → mensaje amable. Fetch falla → log + estado vacío (no rompe la app).
- Receta inexistente → estado "no encontrada".
- Subida de portada falla → `alert` + se mantiene el form (patrón mi-perfil).
- Producto compatible dado de baja / no aprobado → simplemente no aparece en la ficha.

## Testing

- Dominio puro: `recetas.test.js` cubre `productosCompatiblesVisibles` (incluye/excluye
  por aprobado y por existencia, preserva orden, array vacío) y `pasosLimpios`
  (descarta vacíos, recorta, `[]` si nada).
- Servicio y vistas: `node --check` + verificación manual en navegador (convención del
  proyecto: adaptadores Firebase y vistas DOM no se unit-testean).

## Deploy

- Deploy de reglas de Storage (`--only storage`) + hosting.
- Bump de `CACHE_VERSION` del Service Worker (se tocan `base.css`/`components.css`,
  que están en `SHELL_ASSETS`). Actual: v17 → v18.
