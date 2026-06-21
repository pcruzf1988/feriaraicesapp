# Scripts de mantenimiento (Firebase Admin SDK)

Estos scripts corren en tu máquina con privilegios elevados. Necesitan una
**clave de cuenta de servicio** que es un **secreto** (está en `.gitignore`).

## 1. Bajar la clave de servicio

Firebase Console → ⚙️ **Configuración del proyecto** → pestaña **Cuentas de
servicio** → **Generar nueva clave privada** → se descarga un JSON.

Guardalo en la raíz del proyecto como **`serviceAccount.json`**.

> ⚠️ Nunca lo subas al repo ni lo compartas. A diferencia de la config web
> (`public/src/core/firebase/config.js`), este archivo SÍ da acceso total.

## 2. Asignar admin

```bash
npm run set-admin -- tu-email@gmail.com
```

Después cerrá sesión y volvé a entrar en la app para que el token tome el claim.

## 3. Cargar datos de prueba (seed)

```bash
npm run seed
```

Crea categorías, sellos, productores aprobados, productos, recetas y
consumidores de prueba (doc §11.1).
