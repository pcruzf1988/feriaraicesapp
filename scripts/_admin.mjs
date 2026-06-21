// Shared Firebase Admin SDK bootstrap for the maintenance scripts (set-admin, seed).
//
// These scripts run on YOUR machine with elevated privileges, using a service
// account key. That key is a real SECRET — it is gitignored (serviceAccount*.json)
// and must never be committed or shipped to the client.

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccount.json";

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(KEY_PATH, "utf8"));
} catch {
  console.error(
    `\n✗ No encontré la clave de servicio en "${KEY_PATH}".\n` +
      `  Bajala de la consola (Configuración del proyecto → Cuentas de servicio →\n` +
      `  "Generar nueva clave privada") y guardala como ./serviceAccount.json.\n` +
      `  Ver scripts/README.md.\n`
  );
  process.exit(1);
}

const app = initializeApp({ credential: cert(serviceAccount) });

export const auth = getAuth(app);
export const db = getFirestore(app);
export const projectId = serviceAccount.project_id;
