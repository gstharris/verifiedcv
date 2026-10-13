import { afterEach, describe, expect, it } from "vitest";
import {
  LOOP_EVENTS,
  LOOP_REF_KEY,
  consumeCorroboratorRef,
  corroboratorRefFromSearch,
  readCorroboratorRef,
  writeCorroboratorRef
} from "./corroborationLoop";

const memory = new Map<string, string>();

const sessionStorageMock = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  }
};

describe("corroboration loop", () => {
  afterEach(() => {
    memory.clear();
  });

  it("reads a colleague referral from the landing query", () => {
    const ref = corroboratorRefFromSearch(
      new URLSearchParams("ref=GHarris&refName=Graham%20Harris&company=Ge-on")
    );
    expect(ref).toEqual({ handle: "gharris", name: "Graham Harris", company: "Ge-on" });
    expect(corroboratorRefFromSearch(new URLSearchParams("ref="))).toBeNull();
    expect(corroboratorRefFromSearch(new URLSearchParams("ref=../admin"))).toBeNull();
  });

  it("keeps the referral until the new profile is saved", () => {
    Object.defineProperty(globalThis, "window", { value: {}, configurable: true });
    Object.defineProperty(globalThis, "sessionStorage", { value: sessionStorageMock, configurable: true });

    writeCorroboratorRef({ handle: "gharris", name: "Graham Harris", company: "Ge-on" });
    expect(readCorroboratorRef()).toEqual({ handle: "gharris", name: "Graham Harris", company: "Ge-on" });
    expect(memory.has(LOOP_REF_KEY)).toBe(true);

    expect(consumeCorroboratorRef()?.handle).toBe("gharris");
    expect(readCorroboratorRef()).toBeNull();
  });

  it("names the three loop events", () => {
    expect(LOOP_EVENTS).toEqual({
      corroborationCompleted: "corroboration_completed",
      corroboratorProfileStarted: "corroborator_profile_started",
      corroboratorProfileCreated: "corroborator_profile_created"
    });
  });
});
