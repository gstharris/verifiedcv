import { describe, expect, it } from "vitest";
import { reviewResume } from "./resumeReview";

describe("resume review", () => {
  it("flags a typo, a missing metric, and a buzzword", () => {
    const review = reviewResume({
      summary: "Product leader.",
      chapters: [
        {
          id: "m1",
          company: "Ge-on",
          claims: ["Recieve the platform and spearheaded a passionate rollout across teams."]
        }
      ]
    });
    expect(review.notes.join(" ")).toMatch(/recieve/i);
    expect(review.notes.join(" ")).toMatch(/no number/i);
    expect(review.notes.join(" ")).toMatch(/passionate|spearheaded/i);
    expect(review.focusId).toBe("m1");
  });
});