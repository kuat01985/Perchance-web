/**
 * Client-side bridge code that Perchance generators include to talk to
 * the Perchance Vault Browser and access the phone's internal storage.
 */
export const PERCHANCE_CLIENT_SCRIPT = `
(function() {
  if (window.PerchanceStorage) return;

  var pendingRequests = {};
  var isVaultConnected = false;

  window.addEventListener('message', function(event) {
    var data = event.data;
    if (!data || data.type !== 'PERCHANCE_VAULT_RES' || !data.requestId) return;
    
    var resolver = pendingRequests[data.requestId];
    if (resolver) {
      delete pendingRequests[data.requestId];
      if (data.success) {
        resolver.resolve(data.data);
      } else {
        resolver.reject(new Error(data.error || 'PerchanceStorage operation failed'));
      }
    }
  });

  function sendVaultRequest(action, payload) {
    return new Promise(function(resolve, reject) {
      var reqId = 'req_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      pendingRequests[reqId] = { resolve: resolve, reject: reject };

      // Set timeout in case parent is unresponsive
      setTimeout(function() {
        if (pendingRequests[reqId]) {
          delete pendingRequests[reqId];
          reject(new Error('Storage request timed out. Make sure generator is running inside Perchance Vault Browser.'));
        }
      }, 10000);

      window.parent.postMessage({
        type: 'PERCHANCE_VAULT_REQ',
        requestId: reqId,
        action: action,
        payload: payload || {}
      }, '*');
    });
  }

  window.PerchanceStorage = {
    // Check if connected to Phone Storage Vault
    ping: function() {
      return sendVaultRequest('ping');
    },

    // Get phone storage capacity, cache quota and system status
    getInfo: function() {
      return sendVaultRequest('getStorageInfo');
    },

    // Get detailed cache stats: maxQuotaMB, usedMB, percentUsed, systemQuota
    getCacheInfo: function() {
      return sendVaultRequest('getCacheInfo');
    },

    // Change the amount of cache storage allocated (in Megabytes, e.g. 250, 1000, 5000)
    setCacheQuota: function(quotaMB, policy) {
      return sendVaultRequest('setCacheQuota', { quotaMB: quotaMB, policy: policy || 'auto_evict_oldest' });
    },

    // Request persistent storage so the phone OS will never clear the cache
    requestPersistence: function() {
      return sendVaultRequest('requestPersistence');
    },

    // Clear temporary cache or cached generation assets
    clearCache: function(folderPrefix) {
      return sendVaultRequest('clearCache', { folderPrefix: folderPrefix || 'cache/' });
    },

    // List all files in phone storage
    listFiles: function(subPath) {
      return sendVaultRequest('listFiles', { path: subPath });
    },

    // Read a text file from phone storage
    readFile: function(path) {
      return sendVaultRequest('readFile', { path: path });
    },

    // Read and parse JSON file directly
    readJson: function(path) {
      return sendVaultRequest('readFile', { path: path }).then(function(text) {
        return JSON.parse(text);
      });
    },

    // Read image/audio as data URL for <img> src or audio player
    getImageUrl: function(path) {
      return sendVaultRequest('readFile', { path: path, asDataUrl: true });
    },

    // Save a file to phone internal storage
    writeFile: function(path, content, mimeType) {
      var strContent = typeof content === 'object' ? JSON.stringify(content, null, 2) : String(content);
      return sendVaultRequest('writeFile', { path: path, content: strContent, mimeType: mimeType });
    },

    // Save JSON object directly to phone storage
    writeJson: function(path, obj) {
      return this.writeFile(path, JSON.stringify(obj, null, 2), 'application/json');
    },

    // Delete a file from phone storage
    deleteFile: function(path) {
      return sendVaultRequest('deleteFile', { path: path });
    }
  };

  // Dispatch event so generator scripts know storage is ready
  window.dispatchEvent(new CustomEvent('perchance-storage-ready', { detail: window.PerchanceStorage }));
})();
`.trim();

export const PERCHANCE_SNIPPET_HTML = `<!-- Perchance Phone Storage Vault Bridge -->
<script>
${PERCHANCE_CLIENT_SCRIPT}
</script>`;

export const SAMPLE_GENERATOR_CODE = `// Example 1: Read a character from Phone Storage
async function loadHero() {
  try {
    const hero = await PerchanceStorage.readJson("lorebooks/character_sample.json");
    console.log("Loaded hero from phone storage:", hero.name);
    return hero;
  } catch(err) {
    console.error("Could not read file:", err);
  }
}

// Example 2: Save game or story state directly to phone
async function saveStory(chapterData) {
  await PerchanceStorage.writeJson("saves/my_story_save.json", {
    chapter: 1,
    inventory: ["ancient key", "torch"],
    timestamp: new Date().toISOString()
  });
  alert("Saved directly to phone storage!");
}

// Example 3: Change and expand Cache Storage from generator
async function expandCacheStorage() {
  // Expand cache to 1500 MB (1.5 GB) with auto-eviction of oldest temp files
  const updatedCache = await PerchanceStorage.setCacheQuota(1500, "auto_evict_oldest");
  console.log("New cache quota set:", updatedCache.maxQuotaMB, "MB");

  // Prevent phone from deleting cache when device is low on space
  await PerchanceStorage.requestPersistence();
}

// Example 4: List all available files on phone
async function listAllFiles() {
  const files = await PerchanceStorage.listFiles();
  console.log("Phone files:", files.map(f => f.path));
}`;
