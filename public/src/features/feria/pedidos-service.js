// Pedidos service — persists an order "intent" to Firestore (doc §8 pedidos).
// Tapping "Pedir por WhatsApp" records the order with estado "enviado": it feeds
// admin metrics (doc §10) and signals the producer to review availability. The
// pure doc shape comes from domain/carrito.js (buildPedido); this adapter only
// adds the server timestamps and writes.

import { db } from "../../core/firebase/firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

import { buildPedido } from "./domain/carrito.js";

// Records one producer group as a sent order. Rules require consumidorId == the
// signed-in uid (Mis pedidos is a guarded consumer route, so that always holds).
export function registrarPedido(cart, consumidorId) {
  const pedido = buildPedido(cart, consumidorId);
  return addDoc(collection(db, "pedidos"), {
    ...pedido,
    creado: serverTimestamp(),
    enviado: serverTimestamp(),
  });
}
