import { describe, it, expect } from "vitest";
import { formatRelativo } from "./fecha.js";

const now = new Date("2026-06-22T12:00:00");
const daysAgo = (n) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

describe("formatRelativo", () => {
  it("returns 'hoy' for less than a day ago", () => {
    expect(formatRelativo(daysAgo(0), now)).toBe("hoy");
  });

  it("returns 'ayer' for one day ago", () => {
    expect(formatRelativo(daysAgo(1), now)).toBe("ayer");
  });

  it("counts days up to a week", () => {
    expect(formatRelativo(daysAgo(3), now)).toBe("hace 3 días");
    expect(formatRelativo(daysAgo(6), now)).toBe("hace 6 días");
  });

  it("counts weeks (singular and plural) under a month", () => {
    expect(formatRelativo(daysAgo(7), now)).toBe("hace 1 semana");
    expect(formatRelativo(daysAgo(20), now)).toBe("hace 2 semanas");
  });

  it("counts months (singular and plural) beyond that", () => {
    expect(formatRelativo(daysAgo(30), now)).toBe("hace 1 mes");
    expect(formatRelativo(daysAgo(90), now)).toBe("hace 3 meses");
  });

  it("accepts a millisecond timestamp too", () => {
    expect(formatRelativo(daysAgo(1).getTime(), now)).toBe("ayer");
  });

  it("returns an empty string when there is no date", () => {
    expect(formatRelativo(null, now)).toBe("");
    expect(formatRelativo(undefined, now)).toBe("");
  });
});
