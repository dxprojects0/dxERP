import type { RootState } from './store';

const DB_NAME = 'bizop-db';
const STORE_NAME = 'state';
const ACTIVE_EMAIL_KEY = 'dx_active_email';
const STATE_OWNER_EMAIL_KEY = 'dx_state_owner_email';
const GUEST_KEY = 'guest';

const getStateKey = (email?: string | null) => `root:${(email || GUEST_KEY).toLowerCase()}`;

export const setActiveEmailKey = (email?: string | null) => {
  if (!email) {
    localStorage.setItem(ACTIVE_EMAIL_KEY, GUEST_KEY);
    return;
  }
  localStorage.setItem(ACTIVE_EMAIL_KEY, email.toLowerCase());
};

export const getActiveEmailKey = () => localStorage.getItem(ACTIVE_EMAIL_KEY) || GUEST_KEY;
const getStateOwnerEmailKey = () => localStorage.getItem(STATE_OWNER_EMAIL_KEY);

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export const loadState = async (): Promise<Partial<RootState> | undefined> => {
  try {
    const activeEmail = getActiveEmailKey();
    if (activeEmail === GUEST_KEY) return undefined;
    if (activeEmail === 'admin@dxtoolz.com') return undefined;
    const key = getStateKey(activeEmail);
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return await new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result as Partial<RootState> | undefined);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return undefined;
  }
};

export const saveState = async (state: RootState): Promise<void> => {
  try {
    const authEmail = state.config.authEmail?.toLowerCase() || null;
    if (authEmail) {
      localStorage.setItem(STATE_OWNER_EMAIL_KEY, authEmail);
    }
    const emailKey = authEmail || getStateOwnerEmailKey() || getActiveEmailKey();
    const key = getStateKey(emailKey);
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(state, key);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // no-op
  }
};

export const clearStateForEmail = async (email?: string | null): Promise<void> => {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(getStateKey(email || getActiveEmailKey()));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // no-op
  }
};

export const clearAllIndexedDbState = async (): Promise<void> => {
  try {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
      request.onblocked = () => resolve();
    });
  } catch {
    // no-op
  } finally {
    localStorage.setItem(ACTIVE_EMAIL_KEY, GUEST_KEY);
    localStorage.removeItem(STATE_OWNER_EMAIL_KEY);
  }
};
