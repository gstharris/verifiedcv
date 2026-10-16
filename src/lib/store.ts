import fs from "fs";
import path from "path";
import {
  deleteDraftsForPublish,
  deleteStoredDraft,
  DOSSIER_DRAFTS_KEY,
  dossierRecordForFile,
  readDraftMap,
  writeStoredDraft,
  type StoredDraft
} from "./dossierDraft";

const STORE_PATH = path.join(process.cwd(), "vault.json");

export function getVaultStore(): Record<string, any> {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(data);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    }
  } catch (err) {
    console.error("Error reading vault store:", err);
  }
  return {};
}

function writeVaultStore(store: Record<string, any>) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
}

export function saveToVaultStore(handle: string, data: Record<string, any>) {
  const key = handle.toLowerCase().trim();
  if (!key || key === DOSSIER_DRAFTS_KEY) return;
  try {
    const store = getVaultStore();
    store[key] = dossierRecordForFile(data);
    writeVaultStore(store);
  } catch (err) {
    console.error("Error writing to vault store:", err);
  }
}

export function readFileDraft(authUserId: string): StoredDraft | null {
  return readDraftMap(getVaultStore())[authUserId] || null;
}

export function writeFileDraft(authUserId: string, draft: StoredDraft) {
  try {
    writeVaultStore(writeStoredDraft(getVaultStore(), authUserId, draft));
  } catch (err) {
    console.error("Error writing dossier draft:", err);
  }
}

export function deleteFileDraft(authUserId: string) {
  try {
    writeVaultStore(deleteStoredDraft(getVaultStore(), authUserId));
  } catch (err) {
    console.error("Error deleting dossier draft:", err);
  }
}

export function clearFileDraftsAfterPublish(opts: { authUserId?: string | null; handle?: string | null }) {
  try {
    writeVaultStore(deleteDraftsForPublish(getVaultStore(), opts));
  } catch (err) {
    console.error("Error clearing dossier draft after publish:", err);
  }
}
