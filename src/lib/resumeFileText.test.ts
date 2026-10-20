import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  UNREADABLE_WORD_MESSAGE,
  extractResumeFileText,
  odtXmlToText,
  rtfToText,
  wordXmlToText
} from "./resumeFileText";
import { RESUME_FILE_ACCEPT, UNSUPPORTED_RESUME_MESSAGE, resumeFileKind } from "./resumeFileKind";

function zip(files: Record<string, string>) {
  const packed: Record<string, Uint8Array> = {};
  for (const [name, contents] of Object.entries(files)) packed[name] = strToU8(contents);
  return zipSync(packed);
}

const DOCX = {
  "[Content_Types].xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/>
</Types>`,
  "_rels/.rels": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  "word/document.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Ada Lovelace</w:t></w:r></w:p>
    <w:p><w:r><w:t>Analytical Engines | Mathematician | 1843 — Present</w:t></w:r></w:p>
  </w:body>
</w:document>`,
  "word/header1.xml": `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:hdr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:p><w:r><w:t>ada@analytical.test</w:t></w:r></w:p>
</w:hdr>`
};

describe("resume file kinds", () => {
  it("recognizes pdf, word, rtf, opendocument, and text resumes", () => {
    expect(resumeFileKind("resume.pdf", "")).toBe("pdf");
    expect(resumeFileKind("resume.DOCX", "")).toBe("docx");
    expect(resumeFileKind("resume.DOC", "application/msword")).toBe("doc");
    expect(resumeFileKind("notes.rtf", "")).toBe("rtf");
    expect(resumeFileKind("resume.odt", "")).toBe("odt");
    expect(resumeFileKind("resume.md", "")).toBe("text");
    expect(resumeFileKind("resume.txt", "text/plain")).toBe("text");
    expect(resumeFileKind("photo.png", "image/png")).toBe("unsupported");
    expect(RESUME_FILE_ACCEPT).toContain(".doc");
    expect(RESUME_FILE_ACCEPT).toContain(".docx");
    expect(UNSUPPORTED_RESUME_MESSAGE).toMatch(/PDF, Word, RTF/);
  });
});

describe("resume text extraction", () => {
  it("reads rtf control words into lines", () => {
    expect(rtfToText("{\\rtf1\\ansi{\\*\\fonttbl{\\f0 Arial;}}Ada Lovelace\\par Analytical Engines | Mathematician}")).toBe(
      "Ada Lovelace\nAnalytical Engines | Mathematician"
    );
  });

  it("reads word and opendocument paragraphs", () => {
    expect(wordXmlToText("<w:p><w:r><w:t>Ada &amp; Engines</w:t></w:r></w:p>")).toBe("Ada & Engines");
    expect(odtXmlToText("<text:h>Ada Lovelace</text:h><text:p>Analytical Engines</text:p>")).toBe(
      "Ada Lovelace\nAnalytical Engines"
    );
  });

  it("reads a docx body and header", async () => {
    const extracted = await extractResumeFileText("docx", zip(DOCX));
    expect(extracted).toEqual({
      text: expect.stringContaining("Ada Lovelace")
    });
    if ("text" in extracted) {
      expect(extracted.text).toContain("Analytical Engines | Mathematician | 1843 — Present");
      expect(extracted.text).toContain("ada@analytical.test");
    }
  });

  it("reads an opendocument resume", async () => {
    const extracted = await extractResumeFileText(
      "odt",
      zip({
        "content.xml": "<office:text><text:p>Ada Lovelace</text:p><text:p>Analytical Engines | Mathematician</text:p></office:text>"
      })
    );
    expect(extracted).toEqual({ text: "Ada Lovelace\nAnalytical Engines | Mathematician" });
  });

  it("reads a legacy Word file when the bytes are a Word document", async () => {
    const extracted = await extractResumeFileText("doc", zip(DOCX));
    expect("text" in extracted).toBe(true);
    if ("text" in extracted) expect(extracted.text).toContain("Ada Lovelace");
  });

  it("returns a recovery message for a corrupt Word file", async () => {
    const extracted = await extractResumeFileText("doc", new Uint8Array([1, 2, 3, 4]));
    expect(extracted).toEqual({ error: UNREADABLE_WORD_MESSAGE });
    expect(UNREADABLE_WORD_MESSAGE).not.toMatch(/@|linkedin\.com\/in\//);
  });
});
