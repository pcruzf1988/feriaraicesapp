import { describe, it, expect } from "vitest";
import { urlHttpSegura } from "./url.js";

describe("urlHttpSegura", () => {
  it("acepta http y https", () => {
    expect(urlHttpSegura("https://youtu.be/abc")).toBe("https://youtu.be/abc");
    expect(urlHttpSegura("http://example.com")).toBe("http://example.com");
  });

  it("recorta espacios alrededor", () => {
    expect(urlHttpSegura("  https://youtu.be/abc  ")).toBe("https://youtu.be/abc");
  });

  it("rechaza esquemas peligrosos (javascript:, data:, etc.)", () => {
    expect(urlHttpSegura("javascript:alert(1)")).toBeNull();
    expect(urlHttpSegura("JavaScript:alert(1)")).toBeNull();
    expect(urlHttpSegura("data:text/html,<script>")).toBeNull();
    expect(urlHttpSegura("vbscript:msgbox")).toBeNull();
  });

  it("rechaza esquema relativo o ausente", () => {
    expect(urlHttpSegura("//evil.com")).toBeNull();
    expect(urlHttpSegura("youtu.be/abc")).toBeNull();
  });

  it("null/undefined/vacío → null", () => {
    expect(urlHttpSegura(undefined)).toBeNull();
    expect(urlHttpSegura(null)).toBeNull();
    expect(urlHttpSegura("")).toBeNull();
    expect(urlHttpSegura("   ")).toBeNull();
  });
});
