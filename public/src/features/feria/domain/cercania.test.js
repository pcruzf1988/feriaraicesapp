import { describe, it, expect } from "vitest";
import { haversineKm, closenessRank, orderByCloseness } from "./cercania.js";

const identity = (arr) => arr; // deterministic "shuffle" for tests

describe("haversineKm", () => {
  it("is zero for the same point", () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 0, lng: 0 })).toBe(0);
  });
  it("is ~111 km for one degree of latitude", () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111, 0);
  });
});

describe("closenessRank (doc §5.1 bands)", () => {
  it("ranks Local (<=50km) as 0", () => {
    expect(closenessRank(10)).toBe(0);
    expect(closenessRank(50)).toBe(0);
  });
  it("ranks Regional (50-300km) as 1", () => {
    expect(closenessRank(51)).toBe(1);
    expect(closenessRank(300)).toBe(1);
  });
  it("ranks Nacional (>300km) as 2", () => {
    expect(closenessRank(301)).toBe(2);
    expect(closenessRank(1500)).toBe(2);
  });
});

describe("orderByCloseness", () => {
  const ref = { lat: 0, lng: 0 };
  // products carry denormalized producer coords (doc §8)
  const near = { id: "near", productorLat: 0.1, productorLng: 0 };   // ~11km  -> local
  const mid = { id: "mid", productorLat: 1.5, productorLng: 0 };     // ~167km -> regional
  const far = { id: "far", productorLat: 5, productorLng: 0 };       // ~556km -> nacional
  const noCoords = { id: "no", productorLat: null, productorLng: null };

  it("orders by band Local -> Regional -> Nacional", () => {
    const out = orderByCloseness([far, near, mid], ref, identity);
    expect(out.map((p) => p.id)).toEqual(["near", "mid", "far"]);
  });

  it("places products without coordinates last", () => {
    const out = orderByCloseness([noCoords, near], ref, identity);
    expect(out.map((p) => p.id)).toEqual(["near", "no"]);
  });

  it("keeps every product (far ones are never hidden — §5.1)", () => {
    const out = orderByCloseness([far, near, mid, noCoords], ref, identity);
    expect(out).toHaveLength(4);
  });

  it("shuffles within a band (fairness): uses the injected shuffle per band", () => {
    const reverse = (arr) => [...arr].reverse();
    const a = { id: "a", productorLat: 0.1, productorLng: 0 };
    const b = { id: "b", productorLat: 0.2, productorLng: 0 };
    const out = orderByCloseness([a, b], ref, reverse); // both local
    expect(out.map((p) => p.id)).toEqual(["b", "a"]);
  });

  it("with no reference coords, returns all products shuffled (no band order)", () => {
    const out = orderByCloseness([far, near, mid], null, identity);
    expect(out.map((p) => p.id).sort()).toEqual(["far", "mid", "near"]);
    expect(out).toHaveLength(3);
  });
});
