#!/usr/bin/env node

/**
 * Cloudflare Pages Build Script
 * 
 * This script handles the complete build process for Cloudflare Pages deployment,
 * including compilation, building, and preparing static files.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting Cloudflare Pages build process...\n');

// Build steps
const steps = [
  {
    name: 'Compile Configuration',
    command: 'node src/config/compile-config.js',
    description: 'Compiling game configuration files'
  },
  {
    name: 'TypeScript Compilation',
    command: 'tsc',
    description: 'Compiling TypeScript files'
  },
  {
    name: 'Build i18n Files',
    command: 'node scripts/build-i18n.js',
    description: 'Building internationalization files'
  },

];

function executeStep(step) {
  console.log(`📦 ${step.name}:`);
  console.log(`   ${step.description}`);
  
  try {
    const output = execSync(step.command, { 
      encoding: 'utf-8',
      stdio: 'pipe'
    });
    
    if (output.trim()) {
      console.log(`   ✅ Output: ${output.trim().split('\n')[0]}`);
    } else {
      console.log('   ✅ Completed successfully');
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    process.exit(1);
  }
  
  console.log('');
}

// Execute all build steps
steps.forEach(executeStep);

// After i18n build, we have dist/en/ and dist/es/ 
// Copy English version to root for default language
console.log('🌍 Setting up multi-language deployment structure...');

if (fs.existsSync('dist/en')) {
  // Copy English version to root
  console.log('   📁 Copying English version to root...');
  const englishFiles = fs.readdirSync('dist/en');
  englishFiles.forEach(file => {
    const srcPath = path.join('dist/en', file);
    const destPath = path.join('dist', file);
    if (fs.statSync(srcPath).isDirectory()) {
      // Copy directory recursively
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
    console.log(`   ✅ Copied ${file} to root`);
  });
} else {
  console.error('❌ English build not found at dist/en/');
  process.exit(1);
}

// Copy Cloudflare Pages configuration files to dist
console.log('\n📄 Copying Cloudflare Pages configuration files...');

const filesToCopy = [
  { src: '_headers', dest: 'dist/_headers' },
  { src: '_redirects', dest: 'dist/_redirects' }
];

filesToCopy.forEach(({ src, dest }) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`   ✅ Copied ${src} to ${dest}`);
  } else {
    console.log(`   ⚠️  ${src} not found, skipping...`);
  }
});

// Verify dist directory structure
console.log('\n📁 Verifying dist directory structure...');

const requiredFiles = [
  'dist/index.html',
  'dist/assets',
  'dist/en/index.html',
  'dist/es/index.html'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

if (missingFiles.length > 0) {
  console.error('❌ Missing required files:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  process.exit(1);
}

// Display build summary
const distStats = fs.statSync('dist');
const distSize = execSync('du -sh dist', { encoding: 'utf-8' }).trim().split('\t')[0];

console.log('✅ Build completed successfully!');
console.log('');
console.log('📊 Build Summary:');
console.log(`   📁 Output directory: dist/`);
console.log(`   📊 Total size: ${distSize}`);
console.log(`   📅 Built at: ${new Date().toISOString()}`);
console.log('   🌍 Available languages:');
console.log('     • English (default): / and /en/');
console.log('     • Spanish: /es/');
console.log('');
console.log('🚀 Ready for Cloudflare Pages deployment!');
console.log('   Run: npm run deploy:cf');
console.log('   Or:  wrangler pages deploy dist');
console.log(''); 