import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function downloadProjectAsZip(onProgress?: (msg: string) => void) {
  try {
    if (onProgress) onProgress('Fetching complete source bundle...');
    let files: Record<string, string> | null = null;

    // Strategy 1: Dynamic Server API Endpoint
    try {
      const response = await fetch('/api/download-bundle');
      if (response.ok) {
        files = await response.json();
      }
    } catch (e) {
      console.warn('API bundle route error, attempting static fallback...', e);
    }

    // Strategy 2: Static project-bundle fallback
    if (!files || Object.keys(files).length === 0) {
      if (onProgress) onProgress('Loading pre-compiled project bundle...');
      const fallbackResp = await fetch('/project-bundle.json');
      if (fallbackResp.ok) {
        files = await fallbackResp.json();
      }
    }

    if (!files || Object.keys(files).length === 0) {
      throw new Error('Unable to retrieve project files bundle. Please check your network and try again.');
    }

    if (onProgress) onProgress('Creating ZIP archive with batch scripts...');
    const zip = new JSZip();

    // Add all source code files
    for (const [filepath, content] of Object.entries(files)) {
      // Exclude generated bundle file itself or node_modules
      if (filepath.startsWith('public/project-bundle') || filepath.startsWith('node_modules')) {
        continue;
      }
      zip.file(filepath, content);
    }

    // Add Windows 1-Click Setup & Run Script
    const runWindowsBat = `@echo off
title CycloSense AI - Local Server
echo ========================================================
echo   CycloSense AI - Local Setup ^& Launcher
echo ========================================================
echo.
echo [1/2] Checking and installing dependencies (npm install)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to install npm dependencies.
    echo Make sure Node.js is installed from https://nodejs.org/
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [2/2] Launching CycloSense local server on http://localhost:3000...
echo Opening browser in 3 seconds...
start "" "http://localhost:3000"
call npm run dev
pause
`;
    zip.file('START-APP-WINDOWS.bat', runWindowsBat);

    // Add Mac/Linux 1-Click Setup & Run Script
    const runUnixSh = `#!/usr/bin/env bash
echo "========================================================"
echo "  CycloSense AI - Local Setup & Launcher"
echo "========================================================"
echo ""
echo "[1/2] Checking and installing dependencies (npm install)..."
npm install

if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install npm packages. Ensure Node.js is installed from https://nodejs.org/"
    exit 1
fi

echo ""
echo "[2/2] Launching CycloSense local server on http://localhost:3000..."
# Attempt to open browser
if which xdg-open > /dev/null; then
  xdg-open http://localhost:3000 &
elif which open > /dev/null; then
  open http://localhost:3000 &
fi

npm run dev
`;
    zip.file('start-app-mac-linux.sh', runUnixSh);

    // Add quick start README
    const readme = `# CycloSense AI - Complete Local Package

Everything is pre-packaged and ready to run locally with zero setup!

## 🚀 Super Simple 1-Click Launch:

### On Windows:
Double-click: **\`START-APP-WINDOWS.bat\`**
- It will automatically install packages and launch the app in your browser at \`http://localhost:3000\`.

### On Mac / Linux:
1. Open Terminal in this folder.
2. Run:
   \`\`\`bash
   chmod +x start-app-mac-linux.sh
   ./start-app-mac-linux.sh
   \`\`\`

---

## 🛠️ Manual Terminal Run (Standard):
1. Make sure Node.js (LTS version) is installed from https://nodejs.org/
2. Run in terminal:
   \`\`\`bash
   npm install
   npm run dev
   \`\`\`
3. Open: **http://localhost:3000**
`;
    zip.file('README-LOCAL-SETUP.md', readme);

    if (onProgress) onProgress('Compressing into cyclosense-ready.zip...');
    const blob = await zip.generateAsync({ type: 'blob' });

    if (onProgress) onProgress('Starting download...');
    saveAs(blob, 'cyclosense-ready-to-run.zip');
    return true;
  } catch (err) {
    console.error('Download ZIP error:', err);
    throw err;
  }
}
