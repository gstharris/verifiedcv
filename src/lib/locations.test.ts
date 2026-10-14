import { describe, expect, it } from "vitest";
import { flagEmoji, formatLocation, locationError, parseLocation } from "./locations";

describe("locations", () => {
  it("accepts a city with a country and remote", () => {
    expect(parseLocation("Austin, United States")?.countryCode).toBe("US");
    expect(parseLocation("Nairobi, Kenya")?.label).toBe("Nairobi, Kenya");
    expect(parseLocation("Remote")?.label).toBe("Remote");
    expect(parseLocation("Lockhart, Texas, United States")).toEqual({
      city: "Lockhart",
      countryCode: "US",
      label: "Lockhart, TX"
    });
    expect(parseLocation("Thousand Oaks, California, United States")?.label).toBe("Thousand Oaks, CA");
    expect(parseLocation("Thousand Oaks, CA")?.countryCode).toBe("US");
    expect(formatLocation("Lyon", "FR")).toBe("Lyon, France");
  });

  it("rejects a city with no country", () => {
    expect(parseLocation("Austin")).toBeNull();
    expect(locationError("Austin")).toBe("Choose a city and a country, or Remote.");
    expect(locationError("")).toBe("");
  });

  it("builds a flag from the country code", () => {
    expect(flagEmoji("US")).toBe("🇺🇸");
    expect(flagEmoji("KE")).toBe("🇰🇪");
    expect(flagEmoji("remote")).toBe("");
  });
});