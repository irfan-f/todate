/**
 * Google Drive sync adapter: save/load store as a single JSON file (todate-data.json).
 * Requires VITE_GOOGLE_CLIENT_ID. No secrets in repo; client ID only (SPA OAuth flow).
 */
import type { Store } from '../types';
import { isStore } from '../types';

const DRIVE_FILE_NAME = 'todate-data.json';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const GSI_SCRIPT_URL = 'https://accounts.google.com/gsi/client';

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

function getClientId(): string | null {
  const id: unknown = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return typeof id === 'string' && id.length > 0 ? id : null;
}

function loadGsiScript(): Promise<void> {
  if (typeof document === 'undefined') return Promise.reject(new Error('No document'));
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  const existing = document.querySelector(`script[src="${GSI_SCRIPT_URL}"]`);
  if (existing) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GSI_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

/** Returns an access token for Drive API, or null if client ID not set or user denies. */
export function getDriveAccessToken(): Promise<string | null> {
  const clientId = getClientId();
  if (!clientId) return Promise.resolve(null);

  return loadGsiScript()
    .then(() => {
      return new Promise<string | null>((resolve) => {
        if (!window.google?.accounts?.oauth2) {
          resolve(null);
          return;
        }
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: DRIVE_SCOPE,
          callback: (response) => resolve(response.access_token || null),
        });
        client.requestAccessToken();
      });
    })
    .catch(() => null);
}

/** Check if Drive sync is available (client ID configured). */
export function isDriveSyncAvailable(): boolean {
  return getClientId() !== null;
}

interface DriveFileListResponse {
  files?: { id: string; name: string }[];
}

async function findDriveFile(accessToken: string): Promise<string | null> {
  const q = encodeURIComponent(`name='${DRIVE_FILE_NAME}' and trashed=false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Drive list failed');
  const data = (await res.json()) as DriveFileListResponse;
  const file = data.files?.[0];
  return file?.id ?? null;
}

async function createDriveFile(accessToken: string): Promise<string> {
  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: DRIVE_FILE_NAME, mimeType: 'application/json' }),
  });
  if (!res.ok) throw new Error('Drive create failed');
  const data = (await res.json()) as { id: string };
  return data.id;
}

/** Save store to Drive (create or overwrite todate-data.json). */
export async function saveToDrive(store: Store): Promise<void> {
  const token = await getDriveAccessToken();
  if (!token) throw new Error('Drive sign-in required or not configured');

  let fileId = await findDriveFile(token);
  fileId ??= await createDriveFile(token);

  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(store),
    }
  );
  if (!res.ok) throw new Error('Drive upload failed');
}

/** Load store from Drive (todate-data.json). Returns null if file not found or invalid. */
export async function loadFromDrive(): Promise<Store | null> {
  const token = await getDriveAccessToken();
  if (!token) return null;

  const fileId = await findDriveFile(token);
  if (!fileId) return null;

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;

  const text = await res.text();
  try {
    const parsed: unknown = JSON.parse(text);
    if (isStore(parsed)) return parsed;
  } catch {
    /* invalid or non-Store JSON */
  }
  return null;
}
