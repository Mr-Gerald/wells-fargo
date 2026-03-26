const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Use path.resolve to get absolute paths based on the current working directory
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');
const indexHtmlPath = path.resolve(rootDir, 'index.html');
const distIndexHtmlPath = path.resolve(distDir, 'index.html');
const indexTsxPath = path.resolve(rootDir, 'index.tsx');
const distIndexJsPath = path.resolve(distDir, 'index.js');

console.log('🚀 Starting cross-platform build...');
console.log(`📂 Root directory: ${rootDir}`);
console.log(`📂 Dist directory: ${distDir}`);

// 1. Create dist directory if it doesn't exist
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log('✅ Created dist directory');
}

// 2. Copy index.html and replace index.tsx with index.js
try {
  if (!fs.existsSync(indexHtmlPath)) {
    throw new Error(`index.html not found at ${indexHtmlPath}`);
  }
  let htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');
  htmlContent = htmlContent.replace(/\/index\.tsx/g, '/index.js');
  fs.writeFileSync(distIndexHtmlPath, htmlContent);
  console.log('✅ Copied and updated index.html');
} catch (err) {
  console.error('❌ Error processing index.html:', err.message);
  process.exit(1);
}

// 3. Run esbuild
const esbuildCmd = `npx esbuild "${indexTsxPath}" --bundle --outfile="${distIndexJsPath}" --jsx=automatic --format=esm --platform=browser --external:react --external:react-dom/client --external:react-router-dom --external:react/jsx-runtime`;

try {
  console.log('📦 Bundling with esbuild...');
  console.log(`Executing: ${esbuildCmd}`);
  execSync(esbuildCmd, { stdio: 'inherit' });
  console.log('✨ Build complete!');
} catch (err) {
  console.error('❌ esbuild failed:', err.message);
  process.exit(1);
}
