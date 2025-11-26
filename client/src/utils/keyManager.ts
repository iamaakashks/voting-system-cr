import nacl from 'tweetnacl';

const DB_NAME = 'dummy-college-db';
const DB_VERSION = 1;
const STORE_NAME = 'crypto_keys';

let db: IDBDatabase | null = null;

// Helper to convert Uint8Array to a hex string
function uint8ArrayToHexString(bytes: Uint8Array): string {
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper to convert Uint8Array to a base64 string
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}


async function openDB(): Promise<IDBDatabase> {
  if (db) {
    return Promise.resolve(db);
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains(STORE_NAME)) {
        dbInstance.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function saveKeyPair(keyPair: nacl.SignKeyPair): Promise<void> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  store.put({ id: 'signingKey', keyPair });
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

async function getKeyPairFromDB(): Promise<nacl.SignKeyPair | null> {
  const db = await openDB();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const request = store.get('signingKey');
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result ? request.result.keyPair : null);
    };
    request.onerror = () => {
      reject(request.error);
    };
  });
}

function generateKeyPair(): nacl.SignKeyPair {
    return nacl.sign.keyPair();
}

export async function getOrCreateKeyPair(): Promise<nacl.SignKeyPair> {
  let keyPair = await getKeyPairFromDB();
  if (!keyPair) {
    keyPair = generateKeyPair();
    await saveKeyPair(keyPair);
  }
  return keyPair;
}

export function getPublicKeyAsHex(keyPair: nacl.SignKeyPair): string {
    return uint8ArrayToHexString(keyPair.publicKey);
}

export function signMessage(message: string, secretKey: Uint8Array): string {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = nacl.sign.detached(messageBytes, secretKey);
    return uint8ArrayToBase64(signatureBytes);
}
