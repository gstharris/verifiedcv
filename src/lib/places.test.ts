import { describe, expect, it } from "vitest";
import { resolvePlace, suggestPlaces } from "./places";

describe("place suggestions", () => {
  it("resolves a bare city to its country", () => {
    expect(resolvePlace("Paris")?.label).toBe("Paris, France");
    expect(resolvePlace("Paris")?.countryCode).toBe("FR");
  });

  it("resolves a US city written with its state", () => {
    expect(resolvePlace("Los Angeles, CA")?.label).toBe("Los Angeles, United States");
    expect(resolvePlace("Austin")?.countryCode).toBe("US");
  });

  it("keeps the less famous city when the region is included", () => {
    expect(suggestPlaces("Paris").map((place) => place.label)).toContain("Paris, United States");
    expect(resolvePlace("Paris, TX")?.label).toBe("Paris, United States");
    expect(resolvePlace("Remote")?.label).toBe("Remote");
  });
});
