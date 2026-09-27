import fs from 'fs';
import path from 'path';

const STORE_PATH = path.join(process.cwd(), 'vault.json');

export function getVaultStore() {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading vault store:', err);
  }
  return {};
}

export function saveToVaultStore(handle: string, data: any) {
  try {
    const store = getVaultStore();
    store[handle] = data;
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Error writing to vault store:', err);
  }
}
