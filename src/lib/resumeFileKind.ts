export const RESUME_FILE_ACCEPT = ".pdf,.doc,.docx,.rtf,.odt,.txt,.md";
export const UNSUPPORTED_RESUME_MESSAGE = "Upload a PDF, Word, RTF, or text file. Or paste the resume.";

export type ResumeFileKind = "pdf" | "docx" | "doc" | "rtf" | "odt" | "text" | "unsupported";

export function resumeFileKind(name: string, type = ""): ResumeFileKind {
  const lower = String(name || "").toLowerCase().trim();
  const mime = String(type || "").toLowerCase();
  if (lower.endsWith(".pdf") || mime.includes("pdf")) return "pdf";
  if (lower.endsWith(".docx") || mime.includes("wordprocessingml")) return "docx";
  if (lower.endsWith(".doc") || mime === "application/msword") return "doc";
  if (lower.endsWith(".rtf") || mime.includes("rtf")) return "rtf";
  if (lower.endsWith(".odt") || mime.includes("opendocument.text")) return "odt";
  if (
    lower.endsWith(".txt") ||
    lower.endsWith(".md") ||
    lower.endsWith(".markdown") ||
    mime.startsWith("text/plain") ||
    mime.includes("markdown")
  ) {
    return "text";
  }
  return "unsupported";
}
