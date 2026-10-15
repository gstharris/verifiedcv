import { describe, expect, it } from "vitest";
import { interpretStudioMessage } from "./allyIntent";

describe("studio chat intents", () => {
  it("opens skills, including a named skill", () => {
    expect(interpretStudioMessage("I want to edit my skills")).toEqual({ type: "skills", skill: null });
    expect(interpretStudioMessage("edit my skils")).toEqual({ type: "skills", skill: null });
    expect(interpretStudioMessage("add Python to my skills")).toEqual({ type: "skills", skill: "Python" });
  });

  it("treats a mistyped sample-work request as sample work", () => {
    expect(interpretStudioMessage("I want to add seple work")).toEqual({ type: "sample_work" });
    expect(interpretStudioMessage("I want to add sample work")).toEqual({ type: "sample_work" });
    expect(interpretStudioMessage("add a work sample")).toEqual({ type: "sample_work" });
    expect(interpretStudioMessage("add sampel work")).toEqual({ type: "sample_work" });
  });

  it("starts email verification instead of a generic next step", () => {
    expect(interpretStudioMessage("I want to verify my email")).toEqual({
      type: "identity",
      field: "email",
      mode: "verify"
    });
    expect(interpretStudioMessage("verfy my emial")).toEqual({
      type: "identity",
      field: "email",
      mode: "verify"
    });
    expect(interpretStudioMessage("change my phone")).toEqual({
      type: "identity",
      field: "phone",
      mode: "edit"
    });
    expect(interpretStudioMessage("verify LinkedIn")).toEqual({
      type: "identity",
      field: "linkedin",
      mode: "verify"
    });
  });

  it("opens another resume without replacing the chapter editor", () => {
    expect(interpretStudioMessage("Can I add another resume?")).toEqual({ type: "resume" });
    expect(interpretStudioMessage("upload a new cv")).toEqual({ type: "resume" });
    expect(interpretStudioMessage("edit my resume")).toEqual({ type: "chapters", create: false });
    expect(interpretStudioMessage("add another chapter")).toEqual({ type: "chapters", create: true });
  });

  it("keeps company verification on the chapter matcher", () => {
    expect(interpretStudioMessage("I want to verify Fans Agenciy")).toEqual({ type: "pass" });
    expect(interpretStudioMessage("verify SCD")).toEqual({ type: "pass" });
    expect(interpretStudioMessage("verify my portfolio")).toEqual({ type: "pass" });
  });

  it("answers what is next, and does not invent a task for noise", () => {
    expect(interpretStudioMessage("what is next")).toEqual({ type: "next" });
    expect(interpretStudioMessage("help")).toEqual({ type: "help" });
    expect(interpretStudioMessage("asdf qwerty")).toEqual({ type: "unknown" });
  });

  it("routes the rest of the studio", () => {
    expect(interpretStudioMessage("edit my summary").type).toBe("summary");
    expect(interpretStudioMessage("ask a colleague").type).toBe("colleague");
    expect(interpretStudioMessage("attach a w2").type).toBe("document");
    expect(interpretStudioMessage("verify my work email").type).toBe("work_email");
    expect(interpretStudioMessage("save and publish").type).toBe("save");
    expect(interpretStudioMessage("review grammar").type).toBe("review");
    expect(interpretStudioMessage("where is education").type).toBe("education");
  });
});
