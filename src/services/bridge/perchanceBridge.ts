import { phoneStorage } from '../storage/fileSystemBridge';
import { PerchanceBridgeMessage, PerchanceBridgeResponse } from '../storage/types';

export class PerchanceBridgeService {
  private activeListener: ((e: MessageEvent) => void) | null = null;
  private messageLog: { time: string; type: string; details: string; success?: boolean }[] = [];
  private logListeners: (() => void)[] = [];

  public startListening() {
    if (this.activeListener) return;

    this.activeListener = async (event: MessageEvent) => {
      // Validate structure
      const data = event.data as PerchanceBridgeMessage;
      if (!data || data.type !== 'PERCHANCE_VAULT_REQ' || !data.requestId) {
        return;
      }

      const { requestId, action, payload } = data;
      const source = event.source as Window | null;

      try {
        let result: any = null;

        switch (action) {
          case 'ping':
            result = { status: 'connected', version: '1.0.0', time: Date.now() };
            break;

          case 'getStorageInfo':
            const status = phoneStorage.getStorageStatus();
            const files = await phoneStorage.listFiles();
            result = {
              ...status,
              totalFiles: files.length,
              totalBytes: files.reduce((acc, f) => acc + (f.size || 0), 0),
            };
            break;

          case 'getCacheInfo':
            result = await phoneStorage.getCacheInfo();
            break;

          case 'setCacheQuota':
            if (!payload?.quotaMB) throw new Error('Missing quotaMB value');
            result = phoneStorage.setCacheQuota(payload.quotaMB, payload.policy);
            break;

          case 'requestPersistence':
            const granted = await phoneStorage.requestStoragePersistence();
            result = { persistentGranted: granted };
            break;

          case 'clearCache':
            const count = await phoneStorage.clearCache(payload?.folderPrefix || 'cache/');
            result = { deletedCount: count };
            break;

          case 'listFiles':
            const subPath = payload?.path || '';
            const fileList = await phoneStorage.listFiles(subPath);
            result = fileList.map((f) => ({
              path: f.path,
              name: f.name,
              size: f.size,
              type: f.type,
              lastModified: f.lastModified,
              isText: f.isText,
            }));
            break;

          case 'readFile':
            if (!payload?.path) throw new Error('Missing file path');
            if (payload?.asDataUrl) {
              result = await phoneStorage.readFileAsDataUrl(payload.path);
            } else {
              result = await phoneStorage.readFile(payload.path);
            }
            break;

          case 'writeFile':
            if (!payload?.path) throw new Error('Missing file path');
            if (payload.content === undefined) throw new Error('Missing content');
            const savedFile = await phoneStorage.writeFile(payload.path, payload.content, payload.mimeType);
            result = {
              path: savedFile.path,
              size: savedFile.size,
              savedAt: Date.now(),
            };
            break;

          case 'deleteFile':
            if (!payload?.path) throw new Error('Missing file path');
            await phoneStorage.deleteFile(payload.path);
            result = { deleted: true, path: payload.path };
            break;

          default:
            throw new Error(`Unknown action: ${action}`);
        }

        const response: PerchanceBridgeResponse = {
          type: 'PERCHANCE_VAULT_RES',
          requestId,
          success: true,
          data: result,
        };

        if (source) {
          source.postMessage(response, '*');
        }

        this.addLog(`Bridge: [${action}]`, `Path: ${payload?.path || 'N/A'}`, true);
      } catch (err: any) {
        const errorMsg = err?.message || 'Storage bridge operation failed';
        const response: PerchanceBridgeResponse = {
          type: 'PERCHANCE_VAULT_RES',
          requestId,
          success: false,
          error: errorMsg,
        };

        if (source) {
          source.postMessage(response, '*');
        }

        this.addLog(`Bridge Error: [${action}]`, errorMsg, false);
      }
    };

    window.addEventListener('message', this.activeListener);
  }

  public stopListening() {
    if (this.activeListener) {
      window.removeEventListener('message', this.activeListener);
      this.activeListener = null;
    }
  }

  private addLog(type: string, details: string, success: boolean) {
    const time = new Date().toLocaleTimeString();
    this.messageLog.unshift({ time, type, details, success });
    if (this.messageLog.length > 50) this.messageLog.pop();
    this.logListeners.forEach((cb) => cb());
  }

  public getLogs() {
    return this.messageLog;
  }

  public subscribeLogs(cb: () => void) {
    this.logListeners.push(cb);
    return () => {
      this.logListeners = this.logListeners.filter((l) => l !== cb);
    };
  }
}

export const perchanceBridge = new PerchanceBridgeService();
perchanceBridge.startListening();
