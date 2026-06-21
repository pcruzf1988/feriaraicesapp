// UI copy for the two roles. IMPORTANT: these are LABELS only — the stored `rol`
// values remain "consumidor" / "productor" (the data model and security rules
// depend on those exact strings). Change wording here freely; never change the keys.

export const ROLE_LABELS = {
  productor: {
    title: "Soy productor agroecológico",
    desc: "Quiero mostrar y ofrecer lo que produzco",
    iconName: "plant-2",
  },
  consumidor: {
    title: "Quiero comprar agroecológico",
    desc: "Busco productos directo de quien los produce",
    iconName: "basket",
  },
};

// Short label for showing a user's role (e.g. in "Mi cuenta").
export const ROLE_SHORT = {
  productor: "Productor agroecológico",
  consumidor: "Comprador agroecológico",
};
