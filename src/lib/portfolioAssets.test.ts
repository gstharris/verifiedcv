import { describe, expect, it } from "vitest";
import { assetForm, assessPortfolioAssetLink, dossierSectionOrder, highlightLines, isAllowedPortfolioUpload, normalizePortfolioAsset, parseDossierLayout, publicRegistryLabel, recruiterLayout } from "./portfolioAssets";

describe("portfolio asset link checks", () => {
  it("marks Credly certification URLs as registry links", () => {
    const result = assessPortfolioAssetLink("https://www.credly.com/badges/abc", "certification");
    expect(result.verificationStatus).toBe("registry");
  });

  it("marks USPTO and Google Patents URLs as registry links", () => {
    expect(assessPortfolioAssetLink("https://patents.google.com/patent/US1234567", "patent").verificationStatus).toBe(
      "registry"
    );
  });

  it("reserves issuer-linked for credential and patent records", () => {
    expect(publicRegistryLabel("credly")).toBe("Issuer-linked");
    expect(publicRegistryLabel("uspto")).toBe("Issuer-linked");
    expect(publicRegistryLabel("github")).toBe("Public link");
  });

  it("treats a generic project URL as a saved public link", () => {
    const result = assessPortfolioAssetLink("https://example.com/demo", "prototype");
    expect(result.verificationStatus).toBe("link_checked");
  });

  it("drops untitled assets", () => {
    expect(normalizePortfolioAsset({ url: "https://example.com" })).toBeNull();
  });
});

describe("work sample forms", () => {
  it("asks a certification for issuer, year, and a credential link", () => {
    const form = assetForm("certification");
    expect(form.issuer).toBeTruthy();
    expect(form.issuedAt).toBeTruthy();
    expect(form.url).toBeTruthy();
    expect(form.file).toBeUndefined();
    expect(form.description).toBeUndefined();
  });

  it("asks a project for a link or a file, not an issuer", () => {
    const form = assetForm("project");
    expect(form.file).toBeTruthy();
    expect(form.url).toBeTruthy();
    expect(form.issuer).toBeUndefined();
  });

  it("accepts decks and images and rejects other files", () => {
    expect(isAllowedPortfolioUpload("Talk.pptx")).toBe(true);
    expect(isAllowedPortfolioUpload("shot.PNG")).toBe(true);
    expect(isAllowedPortfolioUpload("notes.docx")).toBe(false);
  });
});

describe("recruiter layouts", () => {
  it("keeps older layout ids and separates the resume template from sample work", () => {
    expect(parseDossierLayout("traditional")).toMatchObject({ template: "summary", placement: "bottom" });
    expect(parseDossierLayout("hybrid").placement).toBe("top");
    expect(parseDossierLayout("creative").placement).toBe("top");
    expect(recruiterLayout("summary:top").blocks[0]).toBe("work");
    expect(dossierSectionOrder("experience:bottom")).toEqual(["experience", "skills", "education", "work"]);
    expect(dossierSectionOrder("summary-highlights:top").slice(0, 3)).toEqual(["work", "highlights", "summary"]);
    expect(dossierSectionOrder("highlights:bottom")).not.toContain("summary");
  });

  it("pulls one highlight line from each chapter", () => {
    expect(
      highlightLines([
        { company: "Ge-on", claims: ["Built the onboarding flow for new operators."] },
        { company: "Yahoo", claims: [] }
      ])
    ).toEqual([{ company: "Ge-on", line: "Built the onboarding flow for new operators." }]);
  });
});
