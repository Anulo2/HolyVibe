#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check if we're in the right directory
const serverPackageJsonPath = path.join(__dirname, 'server', 'package.json');
const clientPackageJsonPath = path.join(__dirname, 'client', 'package.json');

console.log('🔍 Checking HolyVibe project dependencies...\n');

// Check server dependencies
if (fs.existsSync(serverPackageJsonPath)) {
  const serverPackage = JSON.parse(fs.readFileSync(serverPackageJsonPath, 'utf8'));
  console.log('📦 Server Dependencies:');

  const requiredServerDeps = {
    'crypto': 'Built-in Node.js module - no installation needed',
    '@orpc/server': serverPackage.dependencies?.['@orpc/server'] || '❌ Missing',
    '@orpc/zod': serverPackage.dependencies?.['@orpc/zod'] || '❌ Missing',
    'nanoid': serverPackage.dependencies?.['nanoid'] || '❌ Missing',
    'zod': serverPackage.dependencies?.['zod'] || '❌ Missing',
  };

  Object.entries(requiredServerDeps).forEach(([dep, version]) => {
    const status = version.includes('❌') ? '❌' : '✅';
    console.log(`  ${status} ${dep}: ${version}`);
  });

  console.log('\n📦 Optional Server Dependencies (for cloud storage):');
  const optionalServerDeps = {
    'aws-sdk': 'For AWS S3 storage (if using AWS)',
    'cloudinary': 'For Cloudinary storage (if using Cloudinary)',
    'multer': 'For multipart form handling (if needed)',
  };

  Object.entries(optionalServerDeps).forEach(([dep, description]) => {
    const hasIt = serverPackage.dependencies?.[dep] || serverPackage.devDependencies?.[dep];
    const status = hasIt ? '✅' : '⚪';
    console.log(`  ${status} ${dep}: ${description}`);
  });

} else {
  console.log('❌ Server package.json not found');
}

console.log('\n' + '='.repeat(50) + '\n');

// Check client dependencies
if (fs.existsSync(clientPackageJsonPath)) {
  const clientPackage = JSON.parse(fs.readFileSync(clientPackageJsonPath, 'utf8'));
  console.log('📦 Client Dependencies:');

  const requiredClientDeps = {
    '@orpc/client': clientPackage.dependencies?.['@orpc/client'] || '❌ Missing',
    '@orpc/tanstack-query': clientPackage.dependencies?.['@orpc/tanstack-query'] || '❌ Missing',
    '@tanstack/react-query': clientPackage.dependencies?.['@tanstack/react-query'] || '❌ Missing',
    'sonner': clientPackage.dependencies?.['sonner'] || '❌ Missing',
    'lucide-react': clientPackage.dependencies?.['lucide-react'] || '❌ Missing',
  };

  Object.entries(requiredClientDeps).forEach(([dep, version]) => {
    const status = version.includes('❌') ? '❌' : '✅';
    console.log(`  ${status} ${dep}: ${version}`);
  });

} else {
  console.log('❌ Client package.json not found');
}

console.log('\n' + '='.repeat(50) + '\n');

// Check for required files
console.log('📁 Required Files Check:');
const requiredFiles = [
  'server/src/services/file-upload.ts',
  'server/src/orpc/file-upload.router.ts',
  'client/src/components/ui/file-upload.tsx',
  'client/src/hooks/useFileUpload.ts',
];

requiredFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  const status = exists ? '✅' : '❌';
  console.log(`  ${status} ${filePath}`);
});

console.log('\n' + '='.repeat(50) + '\n');

// Environment setup check
console.log('🔧 Environment Setup:');
const envFile = path.join(__dirname, 'server', '.env');
const envExists = fs.existsSync(envFile);

console.log(`  ${envExists ? '✅' : '⚪'} .env file: ${envExists ? 'Found' : 'Not found (optional)'}`);

if (envExists) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const hasFileUploadProvider = envContent.includes('FILE_UPLOAD_PROVIDER');
  console.log(`  ${hasFileUploadProvider ? '✅' : '⚪'} FILE_UPLOAD_PROVIDER: ${hasFileUploadProvider ? 'Configured' : 'Not set (will use local)'}`);
}

console.log('\n' + '='.repeat(50) + '\n');

// Installation commands
console.log('🚀 Installation Commands:\n');

console.log('If any server dependencies are missing, run:');
console.log('cd server && bun add @orpc/server @orpc/zod nanoid zod\n');

console.log('If any client dependencies are missing, run:');
console.log('cd client && bun add @orpc/client @orpc/tanstack-query @tanstack/react-query sonner lucide-react\n');

console.log('For cloud storage providers:');
console.log('# For AWS S3:');
console.log('cd server && bun add aws-sdk\n');
console.log('# For Cloudinary:');
console.log('cd server && bun add cloudinary\n');

console.log('📚 Next Steps:');
console.log('1. Install missing dependencies (if any)');
console.log('2. Configure environment variables (see FILE_UPLOAD_CONFIG.md)');
console.log('3. Test file upload functionality');
console.log('4. Consider migrating from base64 to proper file storage');

console.log('\n✨ File upload enhancement setup complete!\n');
