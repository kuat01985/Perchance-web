export interface VaultFile {
  id: string;
  name: string;
  path: string; // e.g. "characters/elena.json" or "notes.txt"
  size: number;
  type: string; // mime type
  lastModified: number;
  content?: string | ArrayBuffer; // cached text or binary data
  isText: boolean;
}

export interface StorageDirectory {
  path: string;
  name: string;
}

export type StorageMode = 'native_directory' | 'internal_virtual' | 'capacitor_native_storage';

export interface CacheConfig {
  maxQuotaMB: number; // e.g. 500 MB, 1000 MB, 2000 MB
  policy: 'warn' | 'auto_evict_oldest' | 'unlimited';
  isPersistentGranted: boolean;
  systemQuotaBytes: number;
  systemUsageBytes: number;
}

export interface StorageStatus {
  mode: StorageMode;
  folderName: string | null;
  isMounted: boolean;
  canWrite: boolean;
  totalFiles: number;
  totalBytes: number;
  cacheQuotaMB: number;
  cachePolicy: 'warn' | 'auto_evict_oldest' | 'unlimited';
  isPersistentGranted: boolean;
}

export interface PerchanceBridgeMessage {
  type: 'PERCHANCE_VAULT_REQ';
  requestId: string;
  action:
    | 'readFile'
    | 'writeFile'
    | 'listFiles'
    | 'deleteFile'
    | 'ping'
    | 'getStorageInfo'
    | 'getCacheInfo'
    | 'setCacheQuota'
    | 'requestPersistence'
    | 'clearCache';
  payload?: any;
}

export interface PerchanceBridgeResponse {
  type: 'PERCHANCE_VAULT_RES';
  requestId: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  description: string;
  category: 'roleplay' | 'story' | 'utility' | 'rpg' | 'tools' | 'custom';
  icon?: string;
}

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  history: string[];
  historyIndex: number;
  isLoading: boolean;
}
