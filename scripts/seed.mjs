// Seeds the test dataset (doc §11.1): categorías, sellos, ~5 productores
// aprobados con productos, recetas y 2 consumidores. Idempotent — uses fixed doc
// IDs, so re-running overwrites instead of duplicating.
//
//   npm run seed
//
// Coordinates come from the Georef API (datos.gob.ar) per doc §5.1, with a
// hardcoded fallback so the seed still works if Georef is unreachable.

import { db, projectId } from "./_admin.mjs";
import { FieldValue } from "firebase-admin/firestore";
import { denormalizeProducto } from "../public/src/features/productor/domain/denormalize.js";

const TS = FieldValue.serverTimestamp();

async function georef(provincia, localidad, fallback) {
  try {
    const url =
      "https://apis.datos.gob.ar/georef/api/localidades" +
      `?provincia=${encodeURIComponent(provincia)}` +
      `&nombre=${encodeURIComponent(localidad)}&campos=centroide&max=1`;
    const res = await fetch(url);
    const json = await res.json();
    const c = json.localidades?.[0]?.centroide;
    if (c) return { lat: c.lat, lng: c.lon, via: "georef" };
  } catch {
    /* fall through to fallback */
  }
  return { ...fallback, via: "fallback" };
}

// ---- Master data ----------------------------------------------------------

const CATEGORIAS = [
  ["verduras", "Verduras"],
  ["frutas", "Frutas"],
  ["hierbas", "Hierbas"],
  ["dulces", "Dulces"],
  ["conservas", "Conservas"],
  ["harinas", "Harinas"],
  ["bebidas", "Bebidas"],
  ["semillas", "Semillas"],
];

const SELLOS = [
  ["spg", "Agroecológico SPG", "Sistema Participativo de Garantía: la comunidad verifica las prácticas agroecológicas.", "Visitas y verificación entre pares dentro del SPG."],
  ["familiar", "Producción familiar", "Producido por agricultura familiar campesina.", "Declaración y verificación del equipo Raíces."],
  ["sin-agroquimicos", "Sin agroquímicos", "Producción libre de agroquímicos de síntesis.", "Verificación de prácticas por el equipo Raíces."],
];

const PRODUCTORES = [
  {
    id: "prod-maimara", nombre: "Huerta La Quebrada",
    provincia: "Jujuy", localidad: "Maimará", fallback: { lat: -23.62, lng: -65.41 },
    whatsapp: "+5493884000001", descripcion: "Familia productora de verduras de quebrada, cosecha del día.",
    coop: { pertenece: false }, sellos: ["spg"],
    productos: [
      { id: "maimara-acelga", nombrePrincipal: "Acelga", otrosNombres: ["Penca"], categoriaId: "verduras", precio: 800, unidad: "atado", disponibilidad: "disponible", descripcion: "Acelga fresca de hoja grande." },
      { id: "maimara-zapallo", nombrePrincipal: "Zapallo criollo", otrosNombres: ["Zapallo plomo"], categoriaId: "verduras", precio: 1100, unidad: "kg", disponibilidad: "disponible", descripcion: "Zapallo criollo de guarda." },
      { id: "maimara-hierbas", nombrePrincipal: "Hierbas serranas", otrosNombres: ["Yuyos"], categoriaId: "hierbas", precio: 600, unidad: "atado", disponibilidad: "poca", descripcion: "Mezcla de hierbas aromáticas de altura." },
    ],
  },
  {
    id: "prod-yavi", nombre: "Flia. Quispe Mamaní",
    provincia: "Jujuy", localidad: "Yavi", fallback: { lat: -22.12, lng: -65.46 },
    whatsapp: "+5493884000002", descripcion: "Productores de granos andinos a 3.400 msnm.",
    coop: { pertenece: false }, sellos: ["familiar", "sin-agroquimicos"],
    productos: [
      { id: "yavi-maiz", nombrePrincipal: "Maíz criollo", otrosNombres: ["Capia", "Maíz blanco"], categoriaId: "semillas", precio: 1500, unidad: "kg", disponibilidad: "disponible", descripcion: "Maíz criollo de polinización abierta." },
      { id: "yavi-poroto", nombrePrincipal: "Poroto pallar", otrosNombres: ["Pallar"], categoriaId: "semillas", precio: 2200, unidad: "kg", disponibilidad: "poca", descripcion: "Poroto pallar grande, ideal para guisos." },
      { id: "yavi-papa", nombrePrincipal: "Papa andina", otrosNombres: ["Papa runa", "Papa criolla"], categoriaId: "verduras", precio: 1300, unidad: "kg", disponibilidad: "disponible", descripcion: "Variedades de papa andina de colores." },
    ],
  },
  {
    id: "prod-tilcara", nombre: "Coop. Cumbres Andinas",
    provincia: "Jujuy", localidad: "Tilcara", fallback: { lat: -23.58, lng: -65.39 },
    whatsapp: "+5493884000003", descripcion: "Cooperativa de pequeños productores de la quebrada.",
    coop: { pertenece: true, nombre: "Coop. Cumbres Andinas" }, sellos: ["spg", "familiar"],
    productos: [
      { id: "tilcara-quinoa", nombrePrincipal: "Quinoa orgánica", otrosNombres: ["Quínoa"], categoriaId: "semillas", precio: 2800, unidad: "kg", disponibilidad: "disponible", descripcion: "Quinoa lavada lista para cocinar." },
      { id: "tilcara-harina-maiz", nombrePrincipal: "Harina de maíz", otrosNombres: ["Harina de capia"], categoriaId: "harinas", precio: 1200, unidad: "kg", disponibilidad: "disponible", descripcion: "Harina de maíz criollo molida a piedra." },
      { id: "tilcara-cayote", nombrePrincipal: "Dulce de cayote", otrosNombres: ["Cayote en almíbar"], categoriaId: "dulces", precio: 1800, unidad: "frasco", disponibilidad: "poca", descripcion: "Dulce artesanal de cayote con nuez." },
    ],
  },
  {
    id: "prod-humahuaca", nombre: "Huerta Valle Verde",
    provincia: "Jujuy", localidad: "Humahuaca", fallback: { lat: -23.2, lng: -65.35 },
    whatsapp: "+5493884000004", descripcion: "Huerta familiar agroecológica del norte de la quebrada.",
    coop: { pertenece: false }, sellos: ["sin-agroquimicos"],
    productos: [
      { id: "humahuaca-zanahoria", nombrePrincipal: "Zanahoria", otrosNombres: [], categoriaId: "verduras", precio: 900, unidad: "kg", disponibilidad: "sin_stock", descripcion: "Zanahoria de estación." },
      { id: "humahuaca-tomate", nombrePrincipal: "Conserva de tomate", otrosNombres: ["Tomate en frasco"], categoriaId: "conservas", precio: 1600, unidad: "frasco", disponibilidad: "disponible", descripcion: "Conserva casera de tomate perita." },
      { id: "humahuaca-te", nombrePrincipal: "Té de hierbas", otrosNombres: ["Yuyos de la puna"], categoriaId: "hierbas", precio: 700, unidad: "atado", disponibilidad: "disponible", descripcion: "Hierbas de la puna para infusión." },
    ],
  },
  {
    id: "prod-sansalvador", nombre: "Granja El Churqui",
    provincia: "Jujuy", localidad: "San Salvador de Jujuy", fallback: { lat: -24.19, lng: -65.3 },
    whatsapp: "+5493884000005", descripcion: "Granja agroecológica cerca de la ciudad capital.",
    coop: { pertenece: false }, sellos: ["spg"],
    productos: [
      { id: "sansalvador-frutilla", nombrePrincipal: "Frutillas", otrosNombres: ["Fresas"], categoriaId: "frutas", precio: 2000, unidad: "kg", disponibilidad: "poca", descripcion: "Frutillas frescas sin agroquímicos." },
      { id: "sansalvador-miel", nombrePrincipal: "Miel de monte", otrosNombres: ["Miel pura"], categoriaId: "dulces", precio: 2500, unidad: "frasco", disponibilidad: "disponible", descripcion: "Miel de abejas de monte, cosecha propia." },
      { id: "sansalvador-jugo", nombrePrincipal: "Jugo de uva", otrosNombres: ["Mosto"], categoriaId: "bebidas", precio: 1900, unidad: "unidad", disponibilidad: "disponible", descripcion: "Jugo natural de uva, sin conservantes." },
    ],
  },
];

const RECETAS = [
  { id: "humita", titulo: "Humita en chala", descripcion: "Maíz criollo rallado y cocido en su propia chala.", instrucciones: ["Rallá el maíz y reservá las chalas.", "Rehogá cebolla y pimentón; sumá el maíz.", "Armá los paquetitos con la chala.", "Cociná en agua hirviendo unos 40 minutos."], productosCompatibles: ["yavi-maiz", "tilcara-harina-maiz"] },
  { id: "locro", titulo: "Locro norteño", descripcion: "Guiso espeso de maíz, poroto y zapallo.", instrucciones: ["Remojá el maíz y el poroto la noche anterior.", "Cociná todo junto con el zapallo a fuego lento.", "Sumá las verduras y dejá espesar.", "Serví con salsa de grasa colorada."], productosCompatibles: ["yavi-maiz", "yavi-poroto", "maimara-zapallo"] },
  { id: "guiso-quinoa", titulo: "Guiso de quinoa", descripcion: "Guiso liviano y nutritivo con quinoa y verduras.", instrucciones: ["Lavá bien la quinoa.", "Rehogá las verduras.", "Sumá la quinoa y caldo; cociná 15 minutos."], productosCompatibles: ["tilcara-quinoa", "yavi-papa"] },
  { id: "dulce-cayote", titulo: "Postre de cayote", descripcion: "Cayote en almíbar con nueces, clásico norteño.", instrucciones: ["Serví el dulce de cayote frío.", "Acompañá con queso de cabra o nueces."], productosCompatibles: ["tilcara-cayote"] },
];

const CONSUMIDORES = [
  { id: "seed-consumidor-ba", nombre: "Consumidor de prueba (BA)", email: "seed-ba@feriaraices.test", provincia: "Ciudad Autónoma de Buenos Aires", localidad: "Buenos Aires", fallback: { lat: -34.61, lng: -58.38 }, rangoEtario: "26-40", genero: "F" },
  { id: "seed-consumidor-rosario", nombre: "Consumidor de prueba (Rosario)", email: "seed-rosario@feriaraices.test", provincia: "Santa Fe", localidad: "Rosario", fallback: { lat: -32.95, lng: -60.66 }, rangoEtario: "41-60", genero: "M" },
];

// ---- Seeding --------------------------------------------------------------

async function run() {
  console.log(`\nSembrando datos de prueba en ${projectId}…\n`);
  let counts = { categorias: 0, sellos: 0, productores: 0, productos: 0, recetas: 0, usuarios: 0 };

  for (const [id, nombre] of CATEGORIAS) {
    await db.collection("categorias").doc(id).set({ nombre, orden: counts.categorias });
    counts.categorias++;
  }

  for (const [id, nombre, descripcion, comoSeObtiene] of SELLOS) {
    await db.collection("sellos").doc(id).set({ nombre, descripcion, comoSeObtiene, logoURL: "" });
    counts.sellos++;
  }

  for (const p of PRODUCTORES) {
    const coord = await georef(p.provincia, p.localidad, p.fallback);
    const productor = {
      estado: "aprobado",
      nombre: p.nombre,
      descripcion: p.descripcion,
      portadaURL: "",
      videos: [],
      redes: {},
      whatsapp: p.whatsapp,
      cooperativa: p.coop,
      ubicacion: { provincia: p.provincia, localidad: p.localidad, lat: coord.lat, lng: coord.lng },
      plan: "gratis",
      sellosDeclarados: p.sellos,
      sellosVerificados: p.sellos,
      creado: TS,
      actualizado: TS,
    };
    await db.collection("productores").doc(p.id).set(productor);
    counts.productores++;
    console.log(`  · ${p.nombre} — ${p.localidad} (${coord.via}: ${coord.lat.toFixed(3)}, ${coord.lng.toFixed(3)})`);

    for (const prod of p.productos) {
      const base = {
        productorId: p.id,
        nombrePrincipal: prod.nombrePrincipal,
        otrosNombres: prod.otrosNombres,
        categoriaId: prod.categoriaId,
        descripcion: prod.descripcion,
        fotos: [],
        precio: prod.precio,
        unidad: prod.unidad,
        disponibilidad: prod.disponibilidad,
        vistas: 0,
        creado: TS,
        actualizado: TS,
      };
      await db.collection("productos").doc(prod.id).set(denormalizeProducto(base, productor));
      counts.productos++;
    }
  }

  for (const r of RECETAS) {
    await db.collection("recetas").doc(r.id).set({
      titulo: r.titulo,
      descripcion: r.descripcion,
      instrucciones: r.instrucciones,
      productosCompatibles: r.productosCompatibles,
      vistas: 0,
    });
    counts.recetas++;
  }

  for (const c of CONSUMIDORES) {
    const ref = await georef(c.provincia, c.localidad, c.fallback);
    await db.collection("usuarios").doc(c.id).set({
      rol: "consumidor",
      nombre: c.nombre,
      email: c.email,
      localidadOrigen: { provincia: c.provincia, localidad: c.localidad },
      localidadReferencia: { provincia: c.provincia, localidad: c.localidad, lat: ref.lat, lng: ref.lng },
      rangoEtario: c.rangoEtario,
      genero: c.genero,
      creado: TS,
    });
    counts.usuarios++;
  }

  console.log("\n✓ Seed completo:", JSON.stringify(counts), "\n");
  process.exit(0);
}

run().catch((err) => {
  console.error("\n✗ Error en el seed:", err.message, "\n");
  process.exit(1);
});
