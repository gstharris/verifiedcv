import { describe, expect, it } from "vitest";
import { toE164 } from "./phone";

describe("toE164", () => {
  it("normalizes US numbers", () => {
    expect(toE164("(818) 661-0117")).toBe("+18186610117");
    expect(toE164("18186610117")).toBe("+18186610117");
    expect(toE164("123")).toBeNull();
  });
});
