import { describe, expect, it } from "vitest";
import { corroborationRequestsForChapter, corroborationStatus } from "./corroborationRequests";

describe("corroboration request status", () => {
  it("maps stored statuses to verified, pending, and declined", () => {
    expect(corroborationStatus("CONFIRMED")).toBe("verified");
    expect(corroborationStatus("PENDING")).toBe("pending");
    expect(corroborationStatus("REJECTED")).toBe("declined");
    expect(corroborationStatus("DECLINED")).toBe("declined");
    expect(corroborationStatus("")).toBe("pending");
  });

  it("lists the emails sent for one chapter, newest first", () => {
    const views = corroborationRequestsForChapter(
      [
        {
          milestone_id: "yahoo",
          attestor_email: "Ada@Yahoo.com",
          status: "PENDING",
          created_at: "2026-03-01T00:00:00.000Z"
        },
        {
          milestone_id: "other",
          attestor_email: "skip@example.com",
          status: "CONFIRMED",
          created_at: "2026-04-01T00:00:00.000Z"
        },
        {
          milestone_id: "yahoo",
          attestor_email: "grace@yahoo.com",
          status: "CONFIRMED",
          created_at: "2026-05-02T00:00:00.000Z"
        },
        {
          milestone_id: "yahoo",
          attestor_email: "nope@yahoo.com",
          status: "REJECTED",
          created_at: "2026-04-15T00:00:00.000Z"
        }
      ],
      "yahoo"
    );

    expect(views).toEqual([
      { email: "grace@yahoo.com", status: "verified", label: "Verified", sentOn: "May 2, 2026" },
      { email: "nope@yahoo.com", status: "declined", label: "Declined", sentOn: "Apr 15, 2026" },
      { email: "ada@yahoo.com", status: "pending", label: "Pending", sentOn: "Mar 1, 2026" }
    ]);
  });
});
