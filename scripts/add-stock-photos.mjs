// One-off: give every product WITHOUT photos a relevant stock image, so the feria
// looks good for demos. Products that already have photos (e.g. the ones Pedro
// uploaded for "Oca") are left untouched.
//
//   node scripts/add-stock-photos.mjs
//
// Images come from LoremFlickr by keyword, made deterministic with ?lock=N so the
// same product always shows the same picture.

import { db } from "./_admin.mjs";

const SIZE = "600/450";
const url = (kw, lock) => `https://loremflickr.com/${SIZE}/${kw}?lock=${lock}`;

// Per-product keyword (best relevance). Keyed by the seed slug (doc id).
const BY_SLUG = {
  "maimara-acelga": "chard",
  "maimara-zapallo": "pumpkin",
  "maimara-hierbas": "herbs",
  "yavi-maiz": "corn",
  "yavi-poroto": "beans",
  "yavi-papa": "potato",
  "tilcara-quinoa": "quinoa",
  "tilcara-harina-maiz": "flour",
  "tilcara-cayote": "jam",
  "humahuaca-zanahoria": "carrot",
  "humahuaca-tomate": "tomato",
  "humahuaca-te": "tea",
  "sansalvador-frutilla": "strawberry",
  "sansalvador-miel": "honey",
  "sansalvador-jugo": "grapes",
};

// Fallback keyword by category for any product not in the slug map.
const BY_CATEGORY = {
  verduras: "vegetables",
  frutas: "fruit",
  hierbas: "herbs",
  dulces: "jam",
  conservas: "preserves",
  harinas: "flour",
  bebidas: "juice",
  semillas: "grains",
};

async function main() {
  const snap = await db.collection("productos").get();
  let updated = 0, skipped = 0, lock = 1;

  for (const doc of snap.docs) {
    const p = doc.data();
    lock += 1;
    if (Array.isArray(p.fotos) && p.fotos.length > 0) {
      skipped += 1;
      continue;
    }
    const kw = BY_SLUG[doc.id] ?? BY_CATEGORY[p.categoriaId] ?? "food";
    const foto = url(kw, lock);
    await doc.ref.update({ fotos: [foto] });
    updated += 1;
    console.log(`  ✓ ${p.nombrePrincipal ?? doc.id} → ${kw}`);
  }

  console.log(`\nListo. ${updated} producto(s) con imagen nueva, ${skipped} con foto propia (sin tocar).`);
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Falló:", err);
  process.exit(1);
});
