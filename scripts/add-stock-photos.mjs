// One-off: give every seeded product a RELEVANT, hand-picked stock image so the
// feria looks good for demos. Photos the user actually uploaded (Firebase Storage)
// are left untouched; previously-assigned stock photos (LoremFlickr/Unsplash) are
// replaced, so this script is safe to re-run.
//
//   node scripts/add-stock-photos.mjs
//
// Images are curated Unsplash URLs (one per product / per category), chosen by
// subject so the picture matches the product. Each was verified to return 200.

import { db } from "./_admin.mjs";

const SIZE = "?w=600&h=450&fit=crop";
const img = (id) => `https://images.unsplash.com/photo-${id}${SIZE}`;

// A photo counts as "stock" (replaceable) if it comes from a stock host. Anything
// else (e.g. firebasestorage.googleapis.com) is treated as user-uploaded and kept.
const STOCK_HOSTS = ["loremflickr.com", "images.unsplash.com"];
const isStock = (u) => typeof u === "string" && STOCK_HOSTS.some((h) => u.includes(h));

// Curated image per seed slug (doc id) — best subject relevance.
const BY_SLUG = {
  "maimara-acelga": img("1558373235-cabfa82b2337"),       // chard / leafy greens
  "maimara-zapallo": img("1509622905150-fa66d3906e09"),   // squash (zapallo)
  "maimara-hierbas": img("1551772413-6c1b7dc18548"),       // fresh leafy herbs
  "yavi-maiz": img("1629570585008-27e194a5d0f8"),          // corn cobs
  "yavi-poroto": img("1564894809611-1742fc40ed80"),        // beans
  "yavi-papa": img("1518977676601-b53f82aba655"),          // potatoes
  "tilcara-quinoa": img("1623428187969-5da2dcea5ebf"),     // quinoa bowl
  "tilcara-harina-maiz": img("1549590143-d5855148a9d5"),   // flour
  "tilcara-cayote": img("1698843813573-1d090c34ea5d"),     // jam jar (cayote)
  "humahuaca-zanahoria": img("1633380110125-f6e685676160"),// carrots
  "humahuaca-tomate": img("1582284540020-8acbe03f4924"),   // tomatoes
  "humahuaca-te": img("1558160074-4d7d8bdf4256"),          // tea
  "sansalvador-frutilla": img("1587393855524-087f83d95bc9"),// strawberries
  "sansalvador-miel": img("1645871317023-00ca188755de"),   // honey jars
  "sansalvador-jugo": img("1474722883778-792e7990302f"),   // grapes / juice
};

// Curated fallback per category for any product not in the slug map.
const BY_CATEGORY = {
  verduras: img("1597362925123-77861d3fbac7"),   // assorted vegetables
  frutas: img("1628689469838-524a4a973b8e"),     // assorted fruit basket
  hierbas: img("1551772413-6c1b7dc18548"),       // fresh leafy herbs
  dulces: img("1500912239908-4ee48acb3a7f"),     // strawberries + jam jar
  conservas: img("1640348784724-93f7b14d8047"),  // shelf of preserve jars
  harinas: img("1627735483792-233bf632619b"),    // flour
  bebidas: img("1474722883778-792e7990302f"),    // grapes / juice
  semillas: img("1574323347407-f5e1ad6d020b"),   // grains / seeds
};

async function main() {
  const snap = await db.collection("productos").get();
  let updated = 0, kept = 0, nomatch = 0;

  for (const doc of snap.docs) {
    const p = doc.data();
    const fotos = Array.isArray(p.fotos) ? p.fotos : [];

    // Keep products that have at least one genuine (non-stock) photo.
    if (fotos.length > 0 && !fotos.every(isStock)) {
      kept += 1;
      continue;
    }

    const foto = BY_SLUG[doc.id] ?? BY_CATEGORY[p.categoriaId];
    if (!foto) {
      nomatch += 1;
      console.log(`  · ${p.nombrePrincipal ?? doc.id} → sin keyword (categoría ${p.categoriaId ?? "?"}), sin tocar`);
      continue;
    }

    await doc.ref.update({ fotos: [foto] });
    updated += 1;
    console.log(`  ✓ ${p.nombrePrincipal ?? doc.id}`);
  }

  console.log(`\nListo. ${updated} con imagen curada, ${kept} con foto propia (sin tocar), ${nomatch} sin match.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("✗ Falló:", err);
  process.exit(1);
});
