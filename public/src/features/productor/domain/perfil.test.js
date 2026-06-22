import { describe, it, expect } from "vitest";
import { buildPerfilPatch } from "./perfil.js";

describe("buildPerfilPatch", () => {
  it("assembles the editable profile fields, trimming and filtering", () => {
    const patch = buildPerfilPatch({
      nombre: "  Huerta La Quebrada  ",
      descripcion: "Verduras de altura",
      portadaURL: "https://x/cover.jpg",
      videos: ["https://youtu.be/abc", "   ", "https://youtu.be/def"],
      instagram: "@huerta",
      facebook: "",
      whatsapp: " +54 9 388 111 ",
      coopPertenece: true,
      coopNombre: "  Coop Norte ",
      sellosDeclarados: ["s1", "s2"],
      pais: "Argentina",
      provincia: "Jujuy",
      localidad: "Maimará",
      lat: -23.6,
      lng: -65.4,
    });

    expect(patch).toEqual({
      nombre: "Huerta La Quebrada",
      descripcion: "Verduras de altura",
      portadaURL: "https://x/cover.jpg",
      videos: ["https://youtu.be/abc", "https://youtu.be/def"],
      redes: { instagram: "@huerta" },
      whatsapp: "+54 9 388 111",
      cooperativa: { pertenece: true, nombre: "Coop Norte" },
      sellosDeclarados: ["s1", "s2"],
      ubicacion: { pais: "Argentina", provincia: "Jujuy", localidad: "Maimará", lat: -23.6, lng: -65.4 },
    });
  });

  it("never includes admin-only fields, even if passed in (security §8.1)", () => {
    const patch = buildPerfilPatch({
      nombre: "X", whatsapp: "123456", provincia: "P", localidad: "L",
      estado: "aprobado", plan: "premium", sellosVerificados: ["s9"],
    });
    expect(patch).not.toHaveProperty("estado");
    expect(patch).not.toHaveProperty("plan");
    expect(patch).not.toHaveProperty("sellosVerificados");
  });

  it("applies sensible defaults for omitted optional fields", () => {
    const patch = buildPerfilPatch({ nombre: "X", whatsapp: "123456", provincia: "P", localidad: "L" });
    expect(patch).toEqual({
      nombre: "X",
      descripcion: "",
      portadaURL: "",
      videos: [],
      redes: {},
      whatsapp: "123456",
      cooperativa: { pertenece: false },
      sellosDeclarados: [],
      ubicacion: { pais: "Argentina", provincia: "P", localidad: "L", lat: null, lng: null },
    });
  });
});
