import { describe, expect, it } from "vitest";
import { repairSkillList, splitSkillText } from "./skills";

describe("skill lists", () => {
  it("keeps commas inside parentheses as one skill", () => {
    expect(splitSkillText("Roadmapping, Triad Operating Model (Eng, Design, PM), Cursor (v0)")).toEqual([
      "Roadmapping",
      "Triad Operating Model (Eng, Design, PM)",
      "Cursor (v0)"
    ]);
  });

  it("rejoins skills that were split inside a parenthetical", () => {
    expect(
      repairSkillList([
        "Triad Operating Model (Eng",
        "Design",
        "PM)",
        "Cursor",
        "v0)",
        "REST APIs"
      ])
    ).toEqual(["Triad Operating Model (Eng, Design, PM)", "Cursor (v0)", "REST APIs"]);
  });
});
