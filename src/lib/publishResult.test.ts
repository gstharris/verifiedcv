import { describe, expect, it } from "vitest";
import { publishEmailChoice, publishFailureMessage } from "./publishResult";

describe("publishFailureMessage", () => {
  it("shows the server reason when publish is rejected", () => {
    expect(publishFailureMessage({ error: "This email already has a page at verifiedcv.app/gharris." })).toBe(
      "This email already has a page at verifiedcv.app/gharris."
    );
  });

  it("keeps a generic message when the response has no reason", () => {
    expect(publishFailureMessage(null)).toBe("Could not publish changes.");
    expect(publishFailureMessage({})).toBe("Could not publish changes.");
    expect(publishFailureMessage({ error: "   " })).toBe("Could not publish changes.");
  });
});

describe("publishEmailChoice", () => {
  it("keeps the page email when the resume email belongs to another page", () => {
    expect(
      publishEmailChoice({
        existingHandle: "gharris",
        existingEmail: "graham@verifiedcv.app",
        incomingEmail: "graham@example.com",
        takenByHandle: "testhandle"
      })
    ).toEqual({
      email: "graham@verifiedcv.app",
      notice: "The resume email already belongs to verifiedcv.app/testhandle. This page kept its current email.",
      kept: true
    });
  });

  it("uses the resume email when it is free or already on this page", () => {
    expect(
      publishEmailChoice({
        existingHandle: "gharris",
        existingEmail: "graham@verifiedcv.app",
        incomingEmail: "graham@verifiedcv.app",
        takenByHandle: "gharris"
      }).kept
    ).toBe(false);
    expect(
      publishEmailChoice({
        existingHandle: "gharris",
        existingEmail: "graham@verifiedcv.app",
        incomingEmail: "new@example.com",
        takenByHandle: ""
      })
    ).toMatchObject({ email: "new@example.com", kept: false });
  });
});
