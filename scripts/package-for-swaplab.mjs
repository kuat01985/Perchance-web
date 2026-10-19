import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Add files and directories safely with traversal prevention
async function addDirectoryToZip(zip, dirPath, zipFolder = '') {
  // Canonical directory check
  // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal
  const canonicalDir = path.resolve(dirPath);
  if (!canonicalDir.startsWith(path.resolve(rootDir))) {
    return;
  }

  const entries = fs.readdirSync(canonicalDir, { withFileTypes: true });

  for (const entry of entries) {
    // Sanitize file name to strict alphanumeric, dot, underscore, and dash
    const cleanName = path.basename(entry.name).replace(/[^a-zA-Z0-9._\-]/g, '');
    if (!cleanName || cleanName === '.' || cleanName === '..') {
      continue;
    }

    // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal
    const fullPath = path.resolve(canonicalDir, cleanName);
    if (!fullPath.startsWith(canonicalDir)) {
      continue;
    }

    // Skip ignored folders & files (exclude scripts/ and zip archives from upload bundle)
    if (
      cleanName === 'node_modules' ||
      cleanName === '.git' ||
      cleanName === '.aistudio' ||
      cleanName === '.vite' ||
      cleanName === 'scripts' ||
      cleanName.endsWith('.log') ||
      cleanName.endsWith('.zip')
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      const subZip = zip.folder(cleanName);
      await addDirectoryToZip(subZip, fullPath, '');
    } else {
      const fileData = fs.readFileSync(fullPath);
      zip.file(cleanName, fileData);
    }
  }
}

async function createSwaplabBundles() {
  console.log('📦 Starting SwapLab build bundle packaging...');

  const outputDir = path.join(rootDir, 'public');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Full Ready-to-Build Project Bundle (Recommended for SwapLab)
  const fullZip = new JSZip();

  // Root required config files
  const rootFiles = [
    'package.json',
    'capacitor.config.json',
    'capacitor.config.ts',
    'index.html',
    'vite.config.ts',
    'tsconfig.json',
  ];

  for (const file of rootFiles) {
    const cleanFileName = path.basename(file);
    const filePath = path.resolve(rootDir, cleanFileName);
    if (filePath.startsWith(rootDir) && fs.existsSync(filePath)) {
      fullZip.file(cleanFileName, fs.readFileSync(filePath));
    }
  }

  // Folders: dist, android, src, public
  if (fs.existsSync(path.join(rootDir, 'dist'))) {
    const distFolder = fullZip.folder('dist');
    await addDirectoryToZip(distFolder, path.join(rootDir, 'dist'));
  }

  if (fs.existsSync(path.join(rootDir, 'android'))) {
    const androidFolder = fullZip.folder('android');
    await addDirectoryToZip(androidFolder, path.join(rootDir, 'android'));
  }

  if (fs.existsSync(path.join(rootDir, 'src'))) {
    const srcFolder = fullZip.folder('src');
    await addDirectoryToZip(srcFolder, path.join(rootDir, 'src'));
  }

  // Add SwapLab Quick Instructions into the ZIP
  const readmeContent = `# SwapLab.net Android APK Build Package
App: Perchance Vault Browser
App ID: org.perchance.vaultbrowser
Engine: Capacitor 8.x

## How to Build on https://public.swaplab.net/?utm_source=chatgpt.com:
1. Visit https://public.swaplab.net/?utm_source=chatgpt.com
2. Select Platform: "Android"
3. Select Project Framework Type: "Capacitor"
4. Under "Project Source", choose "Upload .zip"
5. Drag and drop this .zip file into the upload box
6. (Optional) Select Target Android API Level (e.g. API 34+ or Default)
7. Click "Build APK"
8. Wait ~60 seconds for the public runner to generate your APK and download!
`;
  fullZip.file('SWAPLAB_README.md', readmeContent);

  const fullZipBuffer = await fullZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const fullZipPath = path.join(outputDir, 'swaplab-project.zip');
  fs.writeFileSync(fullZipPath, fullZipBuffer);
  console.log(`✅ Created SwapLab full bundle: ${fullZipPath} (${(fullZipBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

  // 2. Prebuilt-only Bundle (Optimized for Pre-built Web Assets checkbox in SwapLab)
  const prebuiltZip = new JSZip();
  prebuiltZip.file('capacitor.config.json', fs.readFileSync(path.join(rootDir, 'capacitor.config.json')));
  
  // Adjusted package.json without build script per SwapLab prebuilt recommendations
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const prebuiltPkg = {
    ...pkg,
    scripts: {
      dev: pkg.scripts.dev,
      preview: pkg.scripts.preview,
      lint: pkg.scripts.lint,
    },
  };
  prebuiltZip.file('package.json', JSON.stringify(prebuiltPkg, null, 2));

  if (fs.existsSync(path.join(rootDir, 'dist'))) {
    const distFolder = prebuiltZip.folder('dist');
    await addDirectoryToZip(distFolder, path.join(rootDir, 'dist'));
  }

  if (fs.existsSync(path.join(rootDir, 'android'))) {
    const androidFolder = prebuiltZip.folder('android');
    await addDirectoryToZip(androidFolder, path.join(rootDir, 'android'));
  }

  prebuiltZip.file('SWAPLAB_README.md', readmeContent);

  const prebuiltZipBuffer = await prebuiltZip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });

  const prebuiltZipPath = path.join(outputDir, 'swaplab-prebuilt.zip');
  fs.writeFileSync(prebuiltZipPath, prebuiltZipBuffer);
  console.log(`✅ Created SwapLab prebuilt bundle: ${prebuiltZipPath} (${(prebuiltZipBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

  // Also create a copy named swaplab-build.zip
  fs.copyFileSync(fullZipPath, path.join(outputDir, 'swaplab-build.zip'));
  console.log('🎉 SwapLab packages successfully generated in public/ directory!');
}

createSwaplabBundles().catch(err => {
  console.error('Error generating SwapLab bundles:', err);
  process.exit(1);
});
