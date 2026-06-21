# 🌱 Raíces — Feria Digital del Productor al Consumidor
### Documento maestro del proyecto · v1.1

> Plataforma que conecta de forma directa a consumidores con pequeños productores
> campesino-indígenas de productos agroecológicos. Fuerte componente social,
> sustentable, de economía popular y comercio justo.
> **La filosofía agroecológica es la guía de todas las decisiones del proyecto.**

---

## 1. Propósito

Que los pequeños productores campesino-indígenas que producen agroecológico puedan
**diferenciar y poner en valor** lo que hoy se mezcla con la producción convencional
(el camión que junta todo sin distinguir). Hoy solo logran esa valorización en ferias
eventuales; la idea es volver esa feria **permanente y digital**, para que mejoren sus
ingresos y puedan seguir produciendo agroecológico.

**Para el consumidor:** conocer la realidad del productor y su forma de producir
(eso tiene un valor enorme) y comprarle directo.

**No es un e-commerce con pago online.** Es una vidriera digital + un puente: el pedido
y el envío se coordinan directo entre consumidor y productor por WhatsApp.

**Sostenibilidad:** por ahora **sin fondeo y 100% gratuito** para productores y
consumidores. A futuro, si crece, podría evaluarse un **cobro anual a productores**
(aún no definido) — por eso el modelo de datos prevé un campo de "plan/suscripción"
para no tener que rehacer nada. Se diseña para correr dentro del **plan gratuito de
Firebase (Spark)** en la etapa inicial.

---

## 2. Principios rectores (la agroecología como guía)

- **Comercio justo:** ningún productor tiene ventaja fija de visibilidad.
- **Cercanía:** priorizar lo cercano (menos costo de envío, menor huella de carbono).
- **Transparencia y vínculo:** mostrar al productor real, sus procesos, su historia.
- **Soberanía y cuidado:** respetar la privacidad de las comunidades.
- **Baja fricción:** la herramienta se adapta al productor, no al revés.
- **Economía popular:** sin intermediarios que se queden con el valor.

---

## 3. Actores y roles

| Rol | Quién | Acceso |
|-----|-------|--------|
| **Productor** | Familia productora, grupo asociativo o cooperativa (una cuenta = un "vendedor") | Panel propio para cargar perfil y productos |
| **Consumidor** | Comprador final | Explora, arma pedidos, contacta por WhatsApp |
| **Administrador** | El equipo del proyecto | Aprueba registros, carga sellos y recetas, ve estadísticas |

> Todo registro de productor es **revisado y aprobado por un administrador** antes de
> publicarse, para garantizar que cumple los requisitos agroecológicos.

---

## 4. Funcionalidades por actor

### 4.1 Productor (cuenta de vendedor)
**Perfil:**
- Registro/login con **Google** o **correo + contraseña** (mínima fricción; opción de
  contactar al admin para completar el alta).
- Descripción, foto de portada.
- **Videos** sobre sus procesos / su historia → enlaces a YouTube (subidos por ellos o
  por nosotros como admins).
- **Sellos / certificaciones participativas:**
  - Los **administradores** los crean/borran desde el panel (nombre, descripción, cómo se
    obtiene, logo adjunto).
  - Al registrarse, al productor le aparecen los sellos existentes para **elegir cuáles
    tiene** efectivamente.
  - El administrador **verifica y aprueba** cada sello declarado (estado:
    declarado → verificado).
  - El consumidor accede a la info de en qué consiste cada sello y su proceso.
  - *Para arrancar y probar: cargamos 2–3 sellos ficticios.*
- Redes sociales (si tienen).
- Pertenencia a cooperativa / grupo asociativo: **campo opcional** (¿pertenece? sí/no, y
  en ese caso, ¿a cuál?). No es un paso propio del alta.
- **WhatsApp** de contacto.
- Ubicación (para el ordenamiento por cercanía — ver §5 y §8).

**Productos:**
- Nombre principal + **otros nombres** (mismo producto, distintos nombres regionales →
  buscables).
- **Categoría** (verduras, frutas, hierbas, dulces, conservas, harinas, bebidas,
  semillas, … — lista gestionada por el admin y extensible).
- Hasta ~4 fotos. *(Las carga el productor; los admins también pueden cargarlas o
  editarlas en su nombre.)*
- Descripción.
- Precio + **unidad** (por kg, por unidad, por docena, por atado, por frasco, …).
- **Disponibilidad** (estado simple — ver §5).
- Asociación a **recetas** (cargadas por admins en otra sección).

### 4.2 Consumidor
- Registro/login con **Google** o correo + contraseña.
- **Localidad de origen** (donde vive → análisis de mercado) y **localidad de referencia**
  para cercanía/entrega (puede ser distinta, ej. enviar a casa de un familiar).
- **Datos opcionales y autodeclarados** (para análisis de mercado, nunca obligatorios):
  rango etario (no fecha exacta) y género (Femenino · Masculino · Otro · Prefiero no
  decir). Anonimizados en el agregado.
- Buscar productos específicos (incluye búsqueda por "otros nombres").
- **Visualización justa:** todos los productores, por nivel de cercanía con orden
  aleatorio dentro de cada nivel (ver §5).
- **Filtros:** categoría, sello, disponibilidad, "solo cercanos".
- Armar **carritos individuales por productor** (no se centraliza el envío).
- Sección **"Mis pedidos"**: ver §4.5.

### 4.3 Administrador
- Aprobar / rechazar registros de productores.
- Verificar los sellos que cada productor declara.
- Cargar y administrar **sellos** (con su explicación y proceso + logo).
- Cargar y administrar **categorías** de productos.
- Cargar y administrar **recetas** (descripción, instrucciones, productos asociados).
- **Estadísticas** para mejorar (ver §10).

### 4.4 Recetas
- Sección propia, cargada por admins.
- Cada receta: descripción, instrucciones, y **productos que se pueden usar**.
- Se vinculan desde la ficha de producto ("se puede usar en estas recetas").

### 4.5 Mapa de pantallas (sitemap) y flujos

#### 🌐 Pantallas públicas (sin login)
- **Inicio / Feria** — explorar productos (aleatorio por bandas de cercanía), buscador,
  filtros (categoría · sello · disponibilidad), selector de localidad de referencia.
- **Ficha de producto** — hasta 4 fotos, nombre principal + otros nombres, categoría,
  descripción, precio, disponibilidad + última actualización, productor (enlace),
  recetas asociadas, botón **"Agregar al pedido"**.
- **Perfil público del productor** — portada, descripción, videos, sellos (con enlace a
  su info), redes, cooperativa, localidad/zona, sus productos, botón WhatsApp.
- **Recetas** — listado + ficha de receta (descripción, instrucciones, productos
  compatibles enlazados).
- **Info de un sello** — qué es y cómo se obtiene.
- **Ingreso / Registro** — elegir rol: consumidor o productor (Google o correo+clave).

#### 🧺 Consumidor (logueado)
- Todo lo público, **+**
- **Mis pedidos** — carritos guardados, **uno por productor** (no se mezclan). Cada
  tarjeta: productor (foto, localidad, distancia), ítems con cantidad editable
  (sumar/restar/quitar), **total estimado referencial** (no es cobro), botón **"Pedir por
  WhatsApp"**, **borrar pedido**, y estado opcional "enviado/concretado". Estado vacío:
  invita a explorar la feria. Al tocar "Pedir por WhatsApp" se registra un *intento de
  pedido* (métricas + señal al productor para revisar disponibilidad).
- **Mi cuenta** — datos básicos, localidad de referencia.

#### 🌾 Productor (logueado y aprobado)
- **Panel (inicio)** — bienvenida + recordatorio de mantener la disponibilidad al día.
- **Mi perfil** — descripción, portada, videos (YouTube), redes, cooperativa, localidad,
  WhatsApp, selección de sellos (declarado → verificado por admin).
- **Mis productos** — listar / agregar / editar / borrar (nombre, otros nombres,
  categoría, fotos, descripción, precio, disponibilidad, recetas asociadas).
- *(Si aún no está aprobado: vista de "cuenta en revisión" + contacto con el admin; puede
  ir cargando productos mientras tanto.)*

#### 🛠️ Administrador (logueado)
- **Dashboard** — estadísticas.
- **Solicitudes** — aprobar / rechazar productores.
- **Productores** — gestión + verificación de sellos declarados.
- **Sellos** — alta / baja / edición + logo.
- **Categorías** — alta / baja / edición.
- **Recetas** — alta / baja / edición + asociar productos.

#### 🔄 Flujo de alta del productor (asistente de baja fricción)
Lógica: **perfil mínimo publicable + enriquecer después**. Una sola pantalla por paso,
textos simples, y opción de saltar lo no esencial.
1. **Entrar** — Google o correo+clave.
2. **Lo esencial** — nombre del productor/familia, provincia + localidad, WhatsApp.
   *(Con esto ya puede existir.)*
3. **Contame de vos** *(salteable)* — foto de portada + descripción corta.
4. **Tus sellos** *(opcional)* — tilda los que tenga; quedan "a verificar". También puede
   indicar si pertenece a una cooperativa/grupo y cuál.
5. **Cierre** — "¡Listo! Tu perfil está en revisión." Puede empezar a cargar productos
   mientras espera. Botón **"Necesito ayuda"** (abre WhatsApp con los admins) siempre
   visible.
6. El admin **aprueba** → el perfil y los productos se publican.

#### 🔄 Flujo de compra (consumidor)
1. Explora sin necesidad de login (login solo para guardar pedidos).
2. Elige su **localidad de referencia**.
3. Busca / filtra → ve productos (cercanía + aleatorio).
4. **"Agregar al pedido"** → crea o suma al carrito **de ese productor**.
5. En **"Mis pedidos"**, cada carrito → **"Pedir por WhatsApp"** → abre WhatsApp con el
   mensaje pre-armado.
6. Tras la coordinación, el productor **actualiza su disponibilidad**.

---

## 5. Mecánicas clave (decisiones de diseño)

### 5.1 Visualización justa + cercanía  ✅ definido
Los productores están **muy dispersos** (ej. productor en Yavi, consumidor en Buenos
Aires o Rosario, +1500 km). Por eso:
- **Se muestran SIEMPRE todos** los productores — esconder lo lejano sería injusto con los
  productores más remotos, que son los que más se quiere visibilizar. Un consumidor lejano
  igual puede querer esos productos especiales.
- El orden es por **nivel de cercanía** (uso interno para ordenar), calculado desde la
  localidad de referencia del consumidor: Local (~≤50 km) → Regional (~50–300 km) →
  Nacional. **Estos niveles NO se muestran como etiqueta** (evitan que la distancia frene
  la compra); son solo el criterio de orden. *(Umbrales ajustables.)*
- **Implementación:** distancia por fórmula **haversine** entre las coordenadas del
  consumidor (`localidadReferencia`) y las del productor (campos `productorLat/Lng`
  denormalizados en cada producto, ver §8). No hace falta un mapa de provincias limítrofes:
  con las coordenadas de Georef, la distancia sola resuelve los niveles.
- **Dentro de cada nivel, orden aleatorio en cada carga** → comercio justo: nadie tiene
  ventaja fija.
- En cada tarjeta se muestra la **localidad del productor** (cuenta el origen, que es
  parte del valor), sin cartel de distancia. *(Opcional a futuro: un "a X km" positivo
  solo para los muy cercanos, nunca la distancia en los lejanos.)*
- Filtro opcional "solo cercanos" para quien priorice huella/costo.

**Ubicación 100% manual** (sin pedir GPS): tanto productor como consumidor eligen
**provincia + localidad**. Ventaja extra para el consumidor: puede pedir envío a otra
localidad (ej. a la casa de un familiar), no necesariamente donde está parado.
Para calcular distancias, la localidad elegida se traduce a coordenadas con la **API
Georef (datos.gob.ar)**, gratuita y oficial. Se guardan esas coordenadas para el cálculo,
pero al consumidor **solo se le muestra la localidad/zona** (ver §9).

### 5.2 Carrito por vendedor  ✅
Un carrito por productor/cooperativa. No hay envío centralizado.

### 5.3 Pedido por WhatsApp  ✅ definido
El carrito genera un mensaje pre-armado por `wa.me/<telefono>?text=<mensaje>` con el
detalle. El productor lo recibe en su WhatsApp de siempre. Formato propuesto:

```
¡Hola [Productor]! 🌱 Te escribo desde Raíces.
Quiero hacerte este pedido:

• 2 × Acelga
• 1 × Dulce de cayote
• 3 × Zapallo criollo

Total estimado: $X (a confirmar con vos)
Mi nombre: [Consumidor]
Localidad de entrega: [Localidad]

¿Tenés disponible? ¿Cómo coordinamos el envío?
```

### 5.4 Disponibilidad manual (sin stock automático)  ✅ propuesto
- Estados simples: 🟢 Disponible · 🟡 Poca · 🔴 Sin stock.
- Fecha de "última actualización" visible al consumidor (confianza).
- Recordatorio suave en el panel del productor para que mantenga al día su disponibilidad.

---

## 6. Stack tecnológico  ✅ propuesto

| Capa | Elección | Por qué |
|------|----------|---------|
| **Auth** | Firebase Auth (Google + correo/contraseña) | Login de los 3 roles de fábrica |
| **Base de datos** | Cloud Firestore | Productores, productos, recetas, sellos, pedidos |
| **Archivos** | Firebase Storage (fotos) + YouTube (videos) | Videos como enlaces = cero costo |
| **Hosting** | Firebase Hosting | Mismo ecosistema, SSL/CDN gratis, deploy en 1 comando |
| **Frontend** | JavaScript vainilla (ES modules) + SDK Firebase | Zona de confort, sin framework que aprender |
| **Empaquetado** | **PWA** (web instalable) + **Capacitor** para Play Store | Un solo código → web + app Android |
| **Geocodificación** | API Georef (datos.gob.ar) | Localidad → coordenadas, gratis y oficial |
| **Pagos** | Ninguno en la app | Todo se coordina por WhatsApp |
| **Herramientas** | VS Code, Claude Code, Claude Design | — |

### 6.1 Web + App Android desde un solo código  ✅ propuesto
Se construye como **PWA** (Progressive Web App): funciona en la web y es **instalable**
en el celular con su propio ícono (clave para productores, que ya descargan apps de la
Play Store). Para tener una **app publicable en Google Play**, se envuelve esa misma PWA
con **Capacitor** (un solo código base para web y Android; deja la puerta abierta a iOS
más adelante sin rehacer nada).

> Si los paneles (productor/admin) se vuelven complejos de manejar con vainilla puro, se
> puede sumar **Alpine.js** (reactividad liviana, sin build) sin cambiar el enfoque.
> Decisión: arrancamos vainilla y evaluamos sobre la marcha.

---

## 7. Sistema de diseño (oficial — Manual de Identidad Raíces 2025)

**Concepto de marca:** una flor cuyos pétalos son semillas criollas de la región
(poroto, quinoa, maíz, yuca, papa, arroz); el centro en espiral representa la unión entre
ciencia y saberes tradicionales; destaca a mujeres, jóvenes y pueblos indígenas como
guardianes de las semillas. **Slogan institucional:** *"Semillas que unen saberes."*
Dirección visual elegida para la app: **vibrante y ferial**.

**Nombre de la app (en pantalla):** "Feria Raíces", con el tagline funcional *"directo del
productor al consumidor"* debajo del logo (convive con el slogan institucional, que se usa
en contextos de marca del proyecto).

**Logo de la app:** chakana (cruz andina) con dos manos sosteniendo un brote (manos =
productor + consumidor; brote = agroecología; chakana = identidad andina). Está en la
familia cromática del manual, pero algunos tonos difieren de los hex oficiales (el naranja
`#D77000` no existe en el manual; el marrón `#883512` es más rojizo que el cacao `#4E3816`;
amarillo y teal apenas corridos). **Pendiente:** alinear esos tonos a los hex oficiales y
validar el logo con la UGP. *(Generada una versión alineada a los hex del manual:
`logoFeriaRaices_oficial.png`.)*

**Paleta oficial (hex del manual):**

| Color | Hex | Uso en la app |
|-------|-----|---------------|
| Verde | `#0E752D` | Primario / acción principal / "disponible" |
| Verde oliva | `#697526` | Verde secundario / earthy |
| Terracota | `#C94725` | Acento principal / encabezados |
| Rojo | `#E3431C` | Alertas / "sin stock" |
| Amarillo | `#F9BD0B` | Destacados / energía ferial |
| Mostaza/ocre | `#C18A1D` | Sellos / "poca" disponibilidad |
| Teal | `#4E8279` | Info / nivel "Nacional" |
| Azul | `#2797C6` | Acento puntual (redes/links) |
| Cacao | `#4E3816` | Texto principal |
| Crema | `#FBF1DC` (aprox.) | Fondo de pantalla |

**Tipografía oficial:**
- **Amatic SC** (principal, trazo a mano) → logo/wordmark, títulos grandes y momentos
  "feria". *Solo en tamaños grandes y decorativos: no usar para texto chico ni botones.*
- **Quicksand** (apoyo, redondeada) → **toda la UI funcional**: nombres de producto,
  precios, botones, formularios, cuerpo de texto. Prioriza legibilidad (clave por los
  productores de baja alfabetización digital).
- Ambas en Google Fonts.

**Lineamientos:** mobile-first, accesible (contraste WCAG AA), fondo crema/blanco de alta
legibilidad, sin alterar colores/tipografías del logo.

### 7.1 Identidad institucional y aprobación de marca  ⚠️ a prever
Raíces Agroecológicas es un proyecto **trinacional** (Argentina, Bolivia, Brasil) bajo
GP-SAEP. El manual indica que los **materiales digitales (sitios/apps incluidos)** deben:
- Llevar los **logos institucionales** según jerarquía (Financiamiento: UE, FIDA, GP-SAEP ·
  Ejecución: IICA · Líder técnico: Embrapa · Implementadoras AR: ArgenINTA, INTA).
  → Propuesta: ubicarlos en el **pie de página** y en la pantalla **"Acerca de Raíces"**,
  no en cada vista.
- **Validar el uso de marca con la UGP** (contacto de revisión del manual).

---

## 8. Modelo de datos (fino)  ✅ definido

Firestore (NoSQL, orientado a colecciones de documentos). Notación: `?` = opcional,
*(denorm.)* = dato copiado de otra colección para evitar lecturas extra y poder ordenar.

**`usuarios/{uid}`** — doc base, se crea al registrarse.
- `rol`: "consumidor" | "productor"  *(admin NO se guarda acá; ver §8.1)*
- `nombre`, `email`, `creado`
- *(consumidor)* `localidadOrigen`: {provincia, localidad}  *(dónde vive → mercado)*
- *(consumidor)* `localidadReferencia`: {provincia, localidad, lat, lng}  *(para cercanía/entrega)*
- *(consumidor, opcional)* `rangoEtario`, `genero` ("F"|"M"|"Otro"|"NS")

**`productores/{uid}`** — perfil (uid = el del usuario).
- `estado`: "pendiente" | "aprobado" | "rechazado"  *(solo admin)*
- `nombre`, `descripcion`, `portadaURL`, `videos[]` (URLs de YouTube)
- `redes`: {instagram?, facebook?}, `whatsapp`
- `cooperativa`: {pertenece: bool, nombre?}
- `ubicacion`: {provincia, localidad, lat, lng}  *(lat/lng vía Georef)*
- `plan`: "gratis"  *(solo admin; reservado a futuro)*
- `sellosDeclarados[]`: [selloId]  *(los declara el productor)*
- `sellosVerificados[]`: [selloId]  *(solo admin → un sello es "verificado" si está acá)*
- `creado`, `actualizado`

**`productos/{id}`**
- `productorId` (= dueño)
- `nombrePrincipal`, `otrosNombres[]`, `categoriaId`, `descripcion`, `fotos[]` (URLs)
- `precio` (número), `unidad` ("kg"|"unidad"|"docena"|"atado"|"frasco"|…)
- `disponibilidad`: "disponible" | "poca" | "sin_stock"
- `vistas` (número), `creado`, `actualizado`
- *(denorm. del productor, para listar/ordenar sin lecturas extra:)*
  `productorNombre`, `productorLocalidad`, `productorLat`, `productorLng`,
  `productorAprobado` (bool)

**`categorias/{id}`** { nombre, orden? }  *(admin)*

**`sellos/{id}`** { nombre, descripcion, comoSeObtiene, logoURL }  *(admin)*

**`recetas/{id}`** { titulo, descripcion, instrucciones, `productosCompatibles[]`, vistas }
  *(admin)* — el vínculo producto↔receta vive **solo acá**; la ficha de producto consulta
  `recetas where productosCompatibles array-contains productoId` (una sola fuente de verdad).

**`pedidos/{id}`** — carritos guardados del consumidor.
- `consumidorId` (dueño), `productorId`
- `items[]`: [{productoId, nombre, cantidad, precio, unidad}]  *(snapshot, estable aunque cambie el producto)*
- `estado`: "armado" | "enviado" | "concretado"  *("enviado" se marca al tocar "Pedir por WhatsApp")*
- `creado`, `enviado?`

> **Métricas del admin** salen de: `productos.vistas` (más vistos), `pedidos` con
> estado "enviado" (más pedidos / origen del consumidor), y `usuarios` (demografía
> autodeclarada, agregada).

### 8.1 Modelo de acceso y reglas de seguridad  ✅ definido

**Quién es quién:** el rol **admin** se asigna con **custom claims** de Firebase Auth
(`token.admin == true`), nunca con un campo que el usuario pueda editar. Esto evita que
alguien se "ascienda" a admin tocando su documento.

**Resumen de permisos:**

| Colección | Lectura | Escritura |
|-----------|---------|-----------|
| usuarios | dueño + admin | dueño (no puede cambiar su rol a admin); admin |
| productores | público si "aprobado"; dueño y admin siempre | dueño (salvo `estado`, `plan`, `sellosVerificados`); admin todo |
| productos | público | dueño + admin; cualquiera logueado puede solo **+1 en `vistas`** |
| categorias / sellos / recetas | público | solo admin |
| pedidos | dueño + admin (admin para métricas) | solo el dueño consumidor |

Reglas (punto de partida sólido, a afinar al construir):

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function signed()  { return request.auth != null; }
    function isAdmin() { return signed() && request.auth.token.admin == true; }
    function noCambia(c){ return request.resource.data[c] == resource.data[c]; }

    match /usuarios/{uid} {
      allow read:   if isAdmin() || (signed() && request.auth.uid == uid);
      allow create: if signed() && request.auth.uid == uid
                    && request.resource.data.rol in ['consumidor','productor'];
      allow update: if isAdmin() || (signed() && request.auth.uid == uid && noCambia('rol'));
      allow delete: if isAdmin();
    }

    match /productores/{uid} {
      allow read:   if resource.data.estado == 'aprobado' || isAdmin()
                    || (signed() && request.auth.uid == uid);
      allow create: if signed() && request.auth.uid == uid
                    && request.resource.data.estado == 'pendiente'
                    && request.resource.data.sellosVerificados.size() == 0;
      allow update: if isAdmin()
                    || (signed() && request.auth.uid == uid
                        && noCambia('estado') && noCambia('plan')
                        && noCambia('sellosVerificados'));
      allow delete: if isAdmin();
    }

    match /productos/{id} {
      allow read:   if true;
      allow create: if signed() && request.resource.data.productorId == request.auth.uid;
      allow update: if isAdmin()
                    || (signed() && resource.data.productorId == request.auth.uid)
                    || (signed()
                        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['vistas'])
                        && request.resource.data.vistas == resource.data.vistas + 1);
      allow delete: if isAdmin()
                    || (signed() && resource.data.productorId == request.auth.uid);
    }

    match /categorias/{id} { allow read: if true; allow write: if isAdmin(); }
    match /sellos/{id}     { allow read: if true; allow write: if isAdmin(); }
    match /recetas/{id}    { allow read: if true; allow write: if isAdmin(); }

    match /pedidos/{id} {
      allow read:   if isAdmin() || (signed() && resource.data.consumidorId == request.auth.uid);
      allow create: if signed() && request.resource.data.consumidorId == request.auth.uid;
      allow update, delete: if signed() && resource.data.consumidorId == request.auth.uid;
    }
  }
}
```

> Notas: (1) los campos *denorm.* del productor en `productos` (incl. `productorAprobado`)
> los mantiene el sistema al editar el perfil / aprobar (en MVP, desde el cliente del admin;
> a futuro, una Cloud Function). (2) El `+1 en vistas` abierto a usuarios logueados es
> aproximado y puede "inflarse"; alcanza para tendencias. (3) Las fotos en Storage llevan
> reglas equivalentes (dueño + admin escriben; lectura pública).

---

## 9. Privacidad y cuidado de las comunidades  ✅ definido

La ubicación de los productores alimenta el ordenamiento por cercanía, pero mostrar la
ubicación exacta de una familia/chacra puede ser un riesgo. **Decisión:** se guardan
coordenadas (derivadas de la localidad elegida) solo para calcular distancia, y al
consumidor se le muestra **únicamente la localidad/zona**, nunca una dirección exacta.

---

## 10. Estadísticas para administradores  ✅ definido

Foco: análisis de mercado para valorizar productores y mejorar sus ingresos.
- **Productos más vistos** (requiere contar vistas de ficha).
- **Productos más pedidos** (cuenta de *intentos de pedido* por producto/productor).
- **Origen de los consumidores** (localidad / provincia).
- **Demografía autodeclarada** (rango etario, género) — agregada y anónima, solo de
  quienes la cargaron.
- Apoyo operativo: productores activos vs. pendientes, productores sin actividad reciente
  (para acompañarlos).

---

## 11. Fases / roadmap (propuesta)

- **Fase 1 (MVP):** alta y aprobación de productores, perfil con videos y sellos, carga de
  productos, marketplace con búsqueda + cercanía por niveles, carritos por productor,
  pedido por WhatsApp, panel admin básico.
- **Fase 2:** recetas, filtros avanzados, estadísticas.
- **Fase 3:** mejoras según uso real (ej. más productores externos, posible foto principal
  unificada por producto, posible cobro anual a productores).

### 11.1 Plan de datos de prueba (semilla)  ✅ definido
Para arrancar y probar todo el circuito sin esperar carga real:
- **1 admin** (asignado por custom claim).
- **Categorías:** verduras, frutas, hierbas, dulces, conservas, harinas, bebidas, semillas.
- **2–3 sellos ficticios:** "Agroecológico SPG", "Producción familiar", "Sin agroquímicos".
- **~5 productores aprobados** en localidades distintas (Maimará, Yavi, Tilcara, Humahuaca
  y uno cercano a una ciudad) con sus coordenadas Georef → permite ver los niveles de
  cercanía funcionando.
- **3–4 productos por productor** repartidos en categorías, con distinta disponibilidad.
- **3–4 recetas** (humita, locro, etc.) vinculadas a productos.
- **2 consumidores** en ciudades distintas (ej. Buenos Aires y Rosario) para probar el
  orden por cercanía y las métricas de origen.
- Se cargará con un **script de seed** (Node + Firebase Admin SDK) al construir.

---

## 12. ✅ Decisiones tomadas / propuestas vs. ⚠️ pendientes

**Resueltas o propuestas:** stack (Firebase + JS vainilla), empaquetado (PWA + Capacitor
para web y Android), hosting (Firebase), sin pagos en la app, 100% gratis hoy (posible
cobro anual a productores a futuro), **cercanía por niveles Local/Regional/Nacional
mostrando siempre a todos**, ubicación manual por localidad (Georef), privacidad a nivel
localidad, carrito por vendedor, **mensaje de WhatsApp definido**, disponibilidad por
estados, sellos con CRUD de admin + autoselección + verificación, categorías gestionadas
por admin, pedidos guardados con estados + opción de borrar, **datos demográficos
opcionales del consumidor** (rango etario; género F/M/Otro/Prefiero-no-decir), **métricas
del admin definidas**, **asistente de alta del productor definido** (perfil mínimo
publicable), **fotos de producto cargables/editables también por admin**, **cooperativa
como campo opcional**, roles separados por ahora, español únicamente por ahora, mapa de
pantallas y flujos (§4.5), **sistema de diseño oficial del Manual de Identidad 2025**
(paleta + Amatic SC/Quicksand + dirección "vibrante y ferial"), **modelo de datos fino +
reglas de seguridad de Firestore** (§8), **lógica de cercanía por haversine** (§5.1),
**plan de datos de prueba** (§11.1).

**Pendientes (todo lo de diseño está resuelto — lo que queda es ejecución/gestión):**
1. Validación del logo y los colores con la UGP + ubicación de logos institucionales.
2. **Construcción:** scaffolding del proyecto con Claude Code (Firebase + PWA + Capacitor),
   seed de datos de prueba, e iterar pantalla por pantalla (ver §13).

*Mockups de lenguaje visual ya hechos (todas las pantallas clave): Feria (home), ficha de
producto, perfil del productor, alta del productor (wizard), recetas (listado + ficha),
panel admin (dashboard).*

> **Estado: el diseño del proyecto está completo.** Espec funcional, flujos, stack,
> identidad visual, modelo de datos y seguridad, y mockups: todo definido. Listo para
> construir.

---

## 13. Plan de construcción (para Claude Code)

**Repositorio:** `https://github.com/pcruzf1988/feriaraicesapp`

**Orden sugerido de trabajo** (cada bloque, funcionando y probado antes de pasar al siguiente):

0. **Setup**
   - Crear proyecto en Firebase; habilitar Auth (Google + correo/contraseña), Firestore,
     Storage y Hosting.
   - Estructura de carpetas, Firebase SDK, archivo de config, `.gitignore`.
   - Base PWA: `manifest.json` + service worker + íconos. Base de Capacitor (Android).
1. **Infraestructura base**
   - Sistema de diseño: variables CSS con la paleta oficial + fuentes (Amatic SC / Quicksand).
   - Router simple (ES modules), layout general, navegación inferior, componentes base
     (tarjeta de producto, chips, botones).
2. **Auth + roles**
   - Registro/login (Google y correo). Creación del doc `usuarios`. Guardas por rol.
3. **Datos maestros (admin)**
   - CRUD de categorías, sellos y recetas. Publicar las **reglas de seguridad** (§8.1).
   - Script de **seed** con los datos de prueba (§11.1).
4. **Productor**
   - Asistente de alta (wizard), perfil, "Mis productos" (CRUD con fotos).
   - Denormalización de datos del productor en cada producto.
5. **Consumidor / Feria**
   - Marketplace con búsqueda y filtros; orden por cercanía (haversine + Georef).
   - Ficha de producto, perfil del productor, carrito por productor, "Mis pedidos",
     enlace a WhatsApp con mensaje pre-armado (§5.3).
6. **Admin**
   - Aprobación de productores, verificación de sellos, dashboard de métricas (§10).
7. **PWA + Capacitor**
   - Ajustes PWA, build de Android, preparación para Play Store.
8. **QA y deploy**
   - Afinar reglas de seguridad, pruebas, deploy en Firebase Hosting.

> Sugerencia: mantener este documento dentro del repo para que Claude Code lo use como
> referencia viva mientras construye.

---

*v1.1 — diseño completo + plan de construcción. Documento vivo: se actualiza durante el desarrollo.*
