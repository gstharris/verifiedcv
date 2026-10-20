import { unzipSync, strFromU8 } from "fflate";
import type WordExtractor from "word-extractor";
import type { ResumeFileKind } from "./resumeFileKind";

export const UNREADABLE_WORD_MESSAGE = "Could not read that Word file. Paste the resume text, or upload a PDF.";
export const UNREADABLE_RESUME_MESSAGE = "Could not read that file. Paste the resume text, or upload a PDF.";

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

export function rtfToText(rtf: string) {
  const chars: string[] = [];
  let i = 0;
  let depth = 0;
  let skipDepth = -1;

  while (i < rtf.length) {
    const ch = rtf[i];
    if (ch === "{") {
      depth += 1;
      if (rtf[i + 1] === "\\" && rtf[i + 2] === "*" && skipDepth < 0) skipDepth = depth;
      i += 1;
      continue;
    }
    if (ch === "}") {
      if (skipDepth === depth) skipDepth = -1;
      depth = Math.max(0, depth - 1);
      i += 1;
      continue;
    }
    if (skipDepth >= 0) {
      i += 1;
      continue;
    }
    if (ch === "\\") {
      i += 1;
      if (rtf[i] === "\\" || rtf[i] === "{" || rtf[i] === "}") {
        chars.push(rtf[i]);
        i += 1;
        continue;
      }
      if (rtf[i] === "'") {
        const hex = rtf.slice(i + 1, i + 3);
        if (/^[0-9a-fA-F]{2}$/.test(hex)) {
          chars.push(String.fromCharCode(parseInt(hex, 16)));
          i += 3;
          continue;
        }
      }
      if (rtf[i] === "u" && /-?\d/.test(rtf[i + 1] || "")) {
        i += 1;
        let num = "";
        if (rtf[i] === "-") {
          num = "-";
          i += 1;
        }
        while (/\d/.test(rtf[i] || "")) {
          num += rtf[i];
          i += 1;
        }
        if (rtf[i] === " " || rtf[i] === "?") i += 1;
        else if (rtf[i] && rtf[i] !== "\\" && rtf[i] !== "{" && rtf[i] !== "}") i += 1;
        let code = Number(num);
        if (code < 0) code += 65536;
        if (Number.isFinite(code)) chars.push(String.fromCharCode(code));
        continue;
      }
      let word = "";
      while (/[a-zA-Z]/.test(rtf[i] || "")) {
        word += rtf[i];
        i += 1;
      }
      if (rtf[i] === "-") {
        i += 1;
        while (/\d/.test(rtf[i] || "")) i += 1;
      } else {
        while (/\d/.test(rtf[i] || "")) i += 1;
      }
      if (rtf[i] === " ") i += 1;
      if (word === "par" || word === "line") chars.push("\n");
      else if (word === "tab") chars.push("\t");
      continue;
    }
    if (ch === "\r" || ch === "\n") {
      i += 1;
      continue;
    }
    chars.push(ch);
    i += 1;
  }

  return chars.join("").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function markupToText(xml: string, paragraphTags: string[]) {
  let text = xml;
  for (const tag of paragraphTags) {
    text = text.replace(new RegExp(`</${tag}>`, "g"), "\n");
  }
  return decodeXml(text.replace(/<[^>]+>/g, "")).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function wordXmlToText(xml: string) {
  return markupToText(
    xml.replace(/<w:tab\/>/g, "\t").replace(/<w:br\/>/g, "\n"),
    ["w:p"]
  );
}

export function odtXmlToText(xml: string) {
  return markupToText(
    xml.replace(/<text:tab\/>/g, "\t").replace(/<text:line-break\/>/g, "\n"),
    ["text:p", "text:h"]
  );
}

function unzip(bytes: Uint8Array) {
  return unzipSync(bytes);
}

async function extractDocx(bytes: Uint8Array) {
  const loaded = await import("mammoth");
  const mammoth = "extractRawText" in loaded ? loaded : loaded.default;
  const body = (await mammoth.extractRawText({ buffer: Buffer.from(bytes) })).value || "";
  let chrome = "";
  try {
    const files = unzip(bytes);
    chrome = Object.keys(files)
      .filter((name) => /word\/(header|footer)\d+\.xml$/i.test(name))
      .sort()
      .map((name) => wordXmlToText(strFromU8(files[name])))
      .filter(Boolean)
      .join("\n");
  } catch {
    chrome = "";
  }
  return [chrome, body].map((part) => part.trim()).filter(Boolean).join("\n");
}

async function extractDoc(bytes: Uint8Array) {
  const loaded = await import("word-extractor");
  const Extractor = (loaded.default ?? loaded) as typeof WordExtractor;
  const extracted = await new Extractor().extract(Buffer.from(bytes));
  const read = (value: () => string) => {
    try {
      return String(value() || "").trim();
    } catch {
      return "";
    }
  };
  return [read(() => extracted.getHeaders()), read(() => extracted.getBody()), read(() => extracted.getFooters())]
    .filter(Boolean)
    .join("\n");
}

function extractOdt(bytes: Uint8Array) {
  const files = unzip(bytes);
  const xml = files["content.xml"];
  if (!xml) return "";
  return odtXmlToText(strFromU8(xml));
}

export async function extractResumeFileText(
  kind: Exclude<ResumeFileKind, "pdf" | "unsupported">,
  bytes: Uint8Array
): Promise<{ text: string } | { error: string }> {
  try {
    let text = "";
    if (kind === "text") text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    if (kind === "rtf") text = rtfToText(new TextDecoder("utf-8", { fatal: false }).decode(bytes));
    if (kind === "odt") text = extractOdt(bytes);
    if (kind === "docx") text = await extractDocx(bytes);
    if (kind === "doc") text = await extractDoc(bytes);
    if (!text.trim()) {
      return { error: kind === "doc" || kind === "docx" ? UNREADABLE_WORD_MESSAGE : UNREADABLE_RESUME_MESSAGE };
    }
    return { text };
  } catch {
    return { error: kind === "doc" || kind === "docx" ? UNREADABLE_WORD_MESSAGE : UNREADABLE_RESUME_MESSAGE };
  }
}
