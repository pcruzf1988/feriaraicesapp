// Grants the admin custom claim (token.admin == true) to a user by email.
//
//   node scripts/set-admin.mjs <email>
//   npm run set-admin -- <email>
//
// The admin role is NEVER a Firestore field (doc §8.1) — it lives in the auth
// token as a custom claim, which only the Admin SDK can set. After running this,
// the user must sign out and back in for their token to carry the claim.

import { auth, projectId } from "./_admin.mjs";

const email = process.argv[2];
if (!email) {
  console.error("Uso: node scripts/set-admin.mjs <email>");
  process.exit(1);
}

try {
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, { admin: true });
  console.log(`\n✓ ${email} (uid ${user.uid}) ahora es ADMIN en ${projectId}.`);
  console.log("  Cerrá sesión y volvé a entrar en la app para que el token tome el claim.\n");
  process.exit(0);
} catch (err) {
  if (err.code === "auth/user-not-found") {
    console.error(`\n✗ No existe un usuario con el email ${email}.`);
    console.error("  Primero registrate en la app con esa cuenta y volvé a correr esto.\n");
  } else {
    console.error("\n✗ Error:", err.message, "\n");
  }
  process.exit(1);
}
