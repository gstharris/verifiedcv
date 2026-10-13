import { describe, expect, it } from "vitest";
import { resolvePlace, suggestionsFromGeocode, suggestPlaces } from "./places";

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

  it("turns a geocoder hit into a city the candidate can choose", () => {
    const places = suggestionsFromGeocode([
      { name: "Lockhart", country_code: "US", admin1: "Texas", feature_code: "PPL", population: 14500 },
      { name: "United States", country_code: "US", feature_code: "PCLI", population: 300000000 }
    ]);
    expect(places.map((place) => place.label)).toEqual(["Lockhart, Texas, United States"]);
    expect(places[0].countryCode).toBe("US");
  });
});
