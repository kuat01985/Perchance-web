import JSZip from 'jszip';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { VaultFile, StorageStatus, StorageMode, CacheConfig } from './types';

const DB_NAME = 'PerchanceVaultDB';
const STORE_NAME = 'files';
const DB_VERSION = 1;
const CONFIG_KEY = 'perchance_vault_cache_config';

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'path' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

class PhoneStorageManager {
  private mode: StorageMode = 'internal_virtual';
  private dirHandle: FileSystemDirectoryHandle | null = null;
  private folderName: string | null = null;
  private listeners: (() => void)[] = [];

  // Cache Quota Settings
  private maxQuotaMB: number = 500; // default 500 MB
  private cachePolicy: 'warn' | 'auto_evict_oldest' | 'unlimited' = 'auto_evict_oldest';
  private isPersistentGranted: boolean = false;

  constructor() {
    if (Capacitor.isNativePlatform()) {
      this.mode = 'capacitor_native_storage';
      this.folderName = 'Phone Documents';
    }
    this.loadCacheConfig();
    this.checkPersistence();
    this.initDefaultFiles();
  }

  private loadCacheConfig() {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.maxQuotaMB) this.maxQuotaMB = Number(parsed.maxQuotaMB);
        if (parsed.cachePolicy) this.cachePolicy = parsed.cachePolicy;
      }
    } catch (e) {
      console.warn('Failed to load cache config', e);
    }
  }

  private saveCacheConfig() {
    try {
      localStorage.setItem(
        CONFIG_KEY,
        JSON.stringify({
          maxQuotaMB: this.maxQuotaMB,
          cachePolicy: this.cachePolicy,
        })
      );
    } catch (e) {
      console.warn('Failed to save cache config', e);
    }
  }

  public async checkPersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        this.isPersistentGranted = await navigator.storage.persisted();
      } catch (e) {
        this.isPersistentGranted = false;
      }
    }
    return this.isPersistentGranted;
  }

  // Request Android / Phone OS to preserve cache permanently without auto-clearing
  public async requestStoragePersistence(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        const granted = await navigator.storage.persist();
        this.isPersistentGranted = granted;
        this.notify();
        return granted;
      } catch (e) {
        console.warn('Error requesting storage persistence', e);
      }
    }
    return false;
  }

  // Change the amount of storage the cache has (in Megabytes or policy)
  public setCacheQuota(quotaMB: number, policy?: 'warn' | 'auto_evict_oldest' | 'unlimited'): CacheConfig {
    if (quotaMB > 0) {
      this.maxQuotaMB = Math.round(quotaMB);
    }
    if (policy) {
      this.cachePolicy = policy;
    }
    this.saveCacheConfig();
    this.notify();
    return {
      maxQuotaMB: this.maxQuotaMB,
      policy: this.cachePolicy,
      isPersistentGranted: this.isPersistentGranted,
      systemQuotaBytes: 0,
      systemUsageBytes: 0,
    };
  }

  // Get full detailed cache metrics (usage, quota, system capacity)
  public async getCacheInfo(): Promise<CacheConfig & { currentUsedBytes: number; currentUsedMB: number; percentUsed: number }> {
    let systemQuota = 0;
    let systemUsage = 0;

    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        systemQuota = estimate.quota || 0;
        systemUsage = estimate.usage || 0;
      } catch (e) {
        console.warn('Storage estimate failed', e);
      }
    }

    const files = await this.listFiles();
    const currentUsedBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
    const currentUsedMB = Number((currentUsedBytes / (1024 * 1024)).toFixed(2));
    const targetQuotaMB = this.maxQuotaMB;
    const percentUsed = targetQuotaMB > 0 ? Math.min(100, Math.round((currentUsedMB / targetQuotaMB) * 100)) : 0;

    return {
      maxQuotaMB: this.maxQuotaMB,
      policy: this.cachePolicy,
      isPersistentGranted: this.isPersistentGranted,
      systemQuotaBytes: systemQuota,
      systemUsageBytes: systemUsage,
      currentUsedBytes,
      currentUsedMB,
      percentUsed,
    };
  }

  // Clear cache items (can target specific folders e.g. 'cache/', 'temp/', or all)
  public async clearCache(folderPrefix: string = 'cache/'): Promise<number> {
    const files = await this.listFiles();
    let deletedCount = 0;
    for (const f of files) {
      if (!folderPrefix || f.path.startsWith(folderPrefix)) {
        await this.deleteFile(f.path);
        deletedCount++;
      }
    }
    this.notify();
    return deletedCount;
  }

  // Subscribe to changes
  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public isFileSystemAccessSupported(): boolean {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  }

  public getStorageStatus(): StorageStatus {
    return {
      mode: this.mode,
      folderName: this.folderName,
      isMounted: this.mode === 'native_directory' && this.dirHandle !== null,
      canWrite: true,
      totalFiles: 0,
      totalBytes: 0,
      cacheQuotaMB: this.maxQuotaMB,
      cachePolicy: this.cachePolicy,
      isPersistentGranted: this.isPersistentGranted,
    };
  }

  // Request to mount a folder from Phone Internal Storage
  public async mountNativeFolder(): Promise<{ success: boolean; name?: string; error?: string }> {
    if (!this.isFileSystemAccessSupported()) {
      return {
        success: false,
        error: 'Native Folder Picker is not directly supported by this mobile browser. Using Phone Internal Virtual Vault instead.',
      };
    }

    try {
      // @ts-ignore
      const handle = await window.showDirectoryPicker({
        id: 'perchance-phone-vault',
        mode: 'readwrite',
        startIn: 'documents',
      });

      this.dirHandle = handle;
      this.folderName = handle.name;
      this.mode = 'native_directory';

      // Verify permission
      // @ts-ignore
      const permission = await handle.queryPermission({ mode: 'readwrite' });
      if (permission !== 'granted') {
        // @ts-ignore
        const requested = await handle.requestPermission({ mode: 'readwrite' });
        if (requested !== 'granted') {
          return { success: false, error: 'Read/Write permission was not granted by phone.' };
        }
      }

      this.notify();
      return { success: true, name: handle.name };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, error: 'User cancelled folder selection.' };
      }
      return { success: false, error: err.message || 'Failed to mount folder.' };
    }
  }

  public disconnectNativeFolder() {
    this.dirHandle = null;
    this.folderName = null;
    this.mode = 'internal_virtual';
    this.notify();
  }

  // Initial sample files if store is empty
  private async initDefaultFiles() {
    try {
      const files = await this.listFiles();
      if (files.length === 0) {
        await this.writeFile(
          'lorebooks/character_sample.json',
          JSON.stringify(
            {
              name: 'Elena Nightshade',
              role: 'Shadow Rogue',
              traits: ['cunning', 'agile', 'mysterious'],
              inventory: ['twin daggers', 'smoke bomb', 'grappling wire', 'mystic coin'],
              stats: { hp: 120, stealth: 95, attack: 85 },
              lore: 'A wanderer from the northern citadel with an affinity for ancient forgotten vaults.',
            },
            null,
            2
          )
        );

        await this.writeFile(
          'tables/quest_hooks.txt',
          `A missing messenger was last seen entering the Sunken Ruins.\nA merchant offers 500 gold for a rare azure orchid from the venom swamp.\nStrange mechanical clicks echo beneath the old town square at midnight.\nThe royal librarian discovers a cipher carved into ancient stone tablets.`
        );

        await this.writeFile(
          'saves/story_state_01.json',
          JSON.stringify(
            {
              generator: 'ai-character-chat',
              turn: 14,
              location: 'Whispering Caverns',
              affinityScore: 78,
              lastSaved: new Date().toISOString(),
              inventoryStatus: 'Optimal',
            },
            null,
            2
          )
        );
        this.notify();
      }
    } catch (e) {
      console.warn('Init default files error:', e);
    }
  }

  // List all files
  public async listFiles(subPath?: string): Promise<VaultFile[]> {
    if (this.mode === 'native_directory' && this.dirHandle) {
      return this.listNativeFiles(this.dirHandle, '');
    }

    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        let results = (req.result as VaultFile[]) || [];
        if (subPath) {
          const cleanSub = subPath.replace(/^\/+|\/+$/g, '');
          results = results.filter((f) => f.path.startsWith(cleanSub));
        }
        results.sort((a, b) => a.path.localeCompare(b.path));
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  }

  private async listNativeFiles(handle: FileSystemDirectoryHandle, prefix: string): Promise<VaultFile[]> {
    const list: VaultFile[] = [];
    // @ts-ignore
    for await (const entry of handle.values()) {
      const entryPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.kind === 'file') {
        // @ts-ignore
        const fileObj = await entry.getFile();
        const isText = this.isTextMime(fileObj.type, fileObj.name);
        list.push({
          id: entryPath,
          name: entry.name,
          path: entryPath,
          size: fileObj.size,
          type: fileObj.type || this.inferMime(entry.name),
          lastModified: fileObj.lastModified,
          isText,
        });
      } else if (entry.kind === 'directory') {
        const subFiles = await this.listNativeFiles(entry, entryPath);
        list.push(...subFiles);
      }
    }
    return list;
  }

  public async readFile(filePath: string): Promise<string> {
    const cleanPath = filePath.replace(/^\/+/, '');

    if (this.mode === 'native_directory' && this.dirHandle) {
      const file = await this.getNativeFile(this.dirHandle, cleanPath);
      return await file.text();
    }

    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(cleanPath);

      req.onsuccess = () => {
        const item: VaultFile = req.result;
        if (!item) {
          reject(new Error(`File not found: ${filePath}`));
          return;
        }
        if (typeof item.content === 'string') {
          resolve(item.content);
        } else if (item.content instanceof ArrayBuffer) {
          const decoder = new TextDecoder();
          resolve(decoder.decode(item.content));
        } else {
          resolve('');
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  public async readFileAsDataUrl(filePath: string): Promise<string> {
    const cleanPath = filePath.replace(/^\/+/, '');

    if (this.mode === 'native_directory' && this.dirHandle) {
      const file = await this.getNativeFile(this.dirHandle, cleanPath);
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    }

    const db = await openIndexedDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(cleanPath);

      req.onsuccess = () => {
        const item: VaultFile = req.result;
        if (!item) {
          reject(new Error(`File not found: ${filePath}`));
          return;
        }
        if (typeof item.content === 'string') {
          if (item.content.startsWith('data:')) {
            resolve(item.content);
          } else {
            const blob = new Blob([item.content], { type: item.type || 'text/plain' });
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(blob);
          }
        } else if (item.content instanceof ArrayBuffer) {
          const blob = new Blob([item.content], { type: item.type || 'application/octet-stream' });
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(blob);
        } else {
          resolve('');
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Check quota before write, handle auto-eviction if configured
  private async checkQuotaAndEvictIfNeeded(incomingBytes: number) {
    if (this.cachePolicy === 'unlimited') return;

    const files = await this.listFiles();
    const currentBytes = files.reduce((acc, f) => acc + (f.size || 0), 0);
    const maxBytes = this.maxQuotaMB * 1024 * 1024;

    if (currentBytes + incomingBytes > maxBytes) {
      if (this.cachePolicy === 'auto_evict_oldest') {
        // Evict files in cache/ or oldest temporary files first
        const evictable = files.filter((f) => f.path.startsWith('cache/') || f.path.startsWith('temp/'));
        evictable.sort((a, b) => a.lastModified - b.lastModified);

        let freed = 0;
        for (const f of evictable) {
          if (currentBytes - freed + incomingBytes <= maxBytes) break;
          await this.deleteFile(f.path);
          freed += f.size;
        }
      }
      // If still exceeding and warn policy is active, we let it write but log notice
      if (this.cachePolicy === 'warn') {
        console.warn(`Perchance Vault: Cache usage exceeds configured quota of ${this.maxQuotaMB} MB.`);
      }
    }
  }

  public async writeFile(filePath: string, content: string | Blob | ArrayBuffer, mimeType?: string): Promise<VaultFile> {
    const cleanPath = filePath.replace(/^\/+/, '');
    const parts = cleanPath.split('/');
    const fileName = parts[parts.length - 1];
    const inferredType = mimeType || this.inferMime(fileName);

    let contentString: string | ArrayBuffer = '';
    let size = 0;

    if (typeof content === 'string') {
      contentString = content;
      size = new Blob([content]).size;
    } else if (content instanceof Blob) {
      size = content.size;
      if (this.isTextMime(content.type, fileName)) {
        contentString = await content.text();
      } else {
        contentString = await content.arrayBuffer();
      }
    } else if (content instanceof ArrayBuffer) {
      size = content.byteLength;
      contentString = content;
    }

    // Check cache quota
    await this.checkQuotaAndEvictIfNeeded(size);

    if (this.mode === 'native_directory' && this.dirHandle) {
      await this.writeNativeFile(this.dirHandle, cleanPath, contentString);
      this.notify();
      return {
        id: cleanPath,
        name: fileName,
        path: cleanPath,
        size,
        type: inferredType,
        lastModified: Date.now(),
        isText: this.isTextMime(inferredType, fileName),
      };
    }

    const isText = this.isTextMime(inferredType, fileName);
    const vaultItem: VaultFile = {
      id: cleanPath,
      name: fileName,
      path: cleanPath,
      size,
      type: inferredType,
      lastModified: Date.now(),
      content: contentString,
      isText,
    };

    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(vaultItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    this.notify();
    return vaultItem;
  }

  public async deleteFile(filePath: string): Promise<boolean> {
    const cleanPath = filePath.replace(/^\/+/, '');

    if (this.mode === 'native_directory' && this.dirHandle) {
      await this.deleteNativeFile(this.dirHandle, cleanPath);
      this.notify();
      return true;
    }

    const db = await openIndexedDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(cleanPath);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    this.notify();
    return true;
  }

  public async exportAllAsZip(): Promise<Blob> {
    const zip = new JSZip();
    const files = await this.listFiles();

    for (const f of files) {
      try {
        if (this.mode === 'native_directory' && this.dirHandle) {
          const rawFile = await this.getNativeFile(this.dirHandle, f.path);
          zip.file(f.path, rawFile);
        } else {
          const db = await openIndexedDB();
          const item: VaultFile = await new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).get(f.path);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
          });
          if (item && item.content !== undefined) {
            zip.file(f.path, item.content);
          }
        }
      } catch (err) {
        console.warn(`Could not add ${f.path} to zip`, err);
      }
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  public async importZip(zipFile: Blob): Promise<number> {
    const zip = await JSZip.loadAsync(zipFile);
    let count = 0;

    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      const fileName = relativePath.split('/').pop() || relativePath;
      const isText = this.isTextMime('', fileName);

      if (isText) {
        const text = await zipEntry.async('string');
        await this.writeFile(relativePath, text);
      } else {
        const buffer = await zipEntry.async('arraybuffer');
        await this.writeFile(relativePath, buffer);
      }
      count++;
    }

    this.notify();
    return count;
  }

  public async importFiles(files: FileList | File[], targetFolder: string = ''): Promise<number> {
    let count = 0;
    const cleanFolder = targetFolder.replace(/^\/+|\/+$/g, '');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const rel = file.webkitRelativePath || file.name;
      const fullPath = cleanFolder ? `${cleanFolder}/${rel}` : rel;

      if (this.isTextMime(file.type, file.name)) {
        const text = await file.text();
        await this.writeFile(fullPath, text, file.type);
      } else {
        const buf = await file.arrayBuffer();
        await this.writeFile(fullPath, buf, file.type);
      }
      count++;
    }

    this.notify();
    return count;
  }

  private isTextMime(type: string, name: string): boolean {
    if (type.startsWith('text/') || type.includes('json') || type.includes('javascript') || type.includes('xml')) {
      return true;
    }
    const ext = name.split('.').pop()?.toLowerCase();
    return ['txt', 'json', 'md', 'perchance', 'csv', 'yaml', 'yml', 'js', 'html', 'css', 'xml'].includes(ext || '');
  }

  private inferMime(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'json':
        return 'application/json';
      case 'txt':
        return 'text/plain';
      case 'md':
        return 'text/markdown';
      case 'perchance':
        return 'text/plain';
      case 'csv':
        return 'text/csv';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'webp':
        return 'image/webp';
      case 'gif':
        return 'image/gif';
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      default:
        return 'application/octet-stream';
    }
  }

  private async getNativeFile(handle: FileSystemDirectoryHandle, path: string): Promise<File> {
    const parts = path.split('/');
    let currentDir = handle;

    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = await currentDir.getDirectoryHandle(parts[i]);
    }

    const fileHandle = await currentDir.getFileHandle(parts[parts.length - 1]);
    return await fileHandle.getFile();
  }

  private async writeNativeFile(handle: FileSystemDirectoryHandle, path: string, content: string | ArrayBuffer): Promise<void> {
    const parts = path.split('/');
    let currentDir = handle;

    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = await currentDir.getDirectoryHandle(parts[i], { create: true });
    }

    const fileHandle = await currentDir.getFileHandle(parts[parts.length - 1], { create: true });
    // @ts-ignore
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  private async deleteNativeFile(handle: FileSystemDirectoryHandle, path: string): Promise<void> {
    const parts = path.split('/');
    let currentDir = handle;

    for (let i = 0; i < parts.length - 1; i++) {
      currentDir = await currentDir.getDirectoryHandle(parts[i]);
    }

    await currentDir.removeEntry(parts[parts.length - 1]);
  }
}

export const phoneStorage = new PhoneStorageManager();
