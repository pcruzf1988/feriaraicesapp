import { describe, it, expect, vi } from "vitest";
import { createSessionStore, LOADING_SESSION } from "./session-store.js";

describe("createSessionStore", () => {
  it("starts in a loading session until auth resolves", () => {
    const store = createSessionStore();
    expect(store.getSession()).toEqual(LOADING_SESSION);
  });

  it("notifies a subscriber immediately with the current session", () => {
    const store = createSessionStore();
    const fn = vi.fn();
    store.subscribe(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(LOADING_SESSION);
  });

  it("notifies all subscribers when the session changes", () => {
    const store = createSessionStore();
    const a = vi.fn();
    const b = vi.fn();
    store.subscribe(a);
    store.subscribe(b);

    const next = { authed: true, rol: "consumidor", isAdmin: false, user: {}, profile: {} };
    store.setSession(next);

    expect(a).toHaveBeenLastCalledWith(next);
    expect(b).toHaveBeenLastCalledWith(next);
    expect(store.getSession()).toEqual(next);
  });

  it("stops notifying after unsubscribe", () => {
    const store = createSessionStore();
    const fn = vi.fn();
    const unsubscribe = store.subscribe(fn);
    unsubscribe();
    store.setSession({ authed: true, rol: "productor", isAdmin: false });
    // only the immediate call on subscribe happened
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
