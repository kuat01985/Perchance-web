# SwapLab Build Guide — Perchance Vault Browser

This project is configured and verified to build on **[SwapLab Public Builder](https://public.swaplab.net/?utm_source=chatgpt.com)**.

---

## ⚡ 1-Minute Quick Start (Web Builder)

1. **Get the Ready-to-Upload ZIP File:**
   - Either run:
     ```bash
     npm run swaplab:package
     ```
     This generates `public/swaplab-project.zip` (~0.71 MB).
   - Or open the web app, tap the **[APK]** button in the top bar (or open the menu and tap **SwapLab Android Builder**), and click **Download Project .ZIP**.

2. **Open SwapLab Public Builder:**
   - Go to: [https://public.swaplab.net/?utm_source=chatgpt.com](https://public.swaplab.net/?utm_source=chatgpt.com)

3. **Configure Build Settings in SwapLab:**
   - **Target Platform**: Select `Android`
   - **Project Framework Type**: Select `Capacitor`
   - **Capacitor Engine Version**: `8.5.3` (or `8.1.1` / default)
   - **Project Source**: Select `Upload .zip`
   - **Drag & Drop**: Drop `swaplab-project.zip` into the drop zone

4. **Run the Build:**
   - Click the green **"Build APK"** button.
   - The SwapLab public engine runner will run:
     1. Unpack project & verify `capacitor.config.json`
     2. `npm install`
     3. Sync web assets (`dist/`) to Android
     4. Gradle compile (`./gradlew assembleDebug`)
     5. Scan artifact with ClamAV / Trivy
   - Once complete (~45–60 seconds), click **Download APK** to download your Android APK file directly!

---

## 📂 Project Architecture for SwapLab

SwapLab's public runner expects:
- `package.json` with `@capacitor/core` and `@capacitor/android` dependencies.
- `capacitor.config.json` at root with `appId`, `appName`, and `webDir: "dist"`.
- `dist/` directory with compiled web assets (`index.html`, javascript chunks, css, web manifest).
- `android/` directory containing the native Android project with `gradlew` wrapper (Gradle 8.14) and Android permissions in `AndroidManifest.xml`.

### Key Configurations:
- **Application ID**: `org.perchance.vaultbrowser`
- **Application Name**: `Perchance Vault Browser`
- **Web Directory**: `dist`
- **Plugins**: `@capacitor/filesystem` (native phone storage & cache bridge)
- **Permissions**:
  - `INTERNET`
  - `ACCESS_NETWORK_STATE`
  - `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`
  - `android:usesCleartextTraffic="true"` (allows loading iframes and assets from Perchance generator domains)

---

## 🛠️ Local Build & Packaging Commands

```bash
# Compile web assets
npm run build

# Synchronize web assets to native Android folder
npm run cap:sync

# Build and package both full and pre-built ZIP bundles
npm run swaplab:package
```

### Generated Files:
- `public/swaplab-project.zip` — Full project bundle with `dist/`, `android/`, `src/`, `package.json`, `capacitor.config.json`.
- `public/swaplab-prebuilt.zip` — Lightweight bundle optimized for SwapLab's "Pre-built Web Assets" option.

---

## 🔒 Security & Semgrep SAST Compliance
SwapLab runs Semgrep static code analysis before compilation. This repository includes:
- **Target Origin Validation**: Window postMessage listeners in `perchanceBridge.ts` validate target origins instead of wildcard `*`.
- **Log Formatting**: Formatted strings use constant literals in `fileSystemBridge.ts`.
- **Path Sanitization**: `package-for-swaplab.mjs` enforces canonical path bounds and sanitization.
- **Exported Activity Rules**: `AndroidManifest.xml` includes `tools:ignore="ExportedActivity"` and `<!-- nosemgrep -->` annotations for standard launcher activities.
- **Zero-Retention**: Uploaded files are cleared immediately after the build completes.
