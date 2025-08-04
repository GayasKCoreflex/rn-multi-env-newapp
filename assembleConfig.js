/**
 * assembleConfig.js - React Native Android Bundle-Build-Assemble Script
 *
 * Purpose:
 * Automates bundling, building, and deployment (local or CI/CD) of Android builds 
 * for different environments: `dev`, `uat`, and `prod`.
 *
 * Usage:
 *    node assembleConfig.js <environment> [buildType]
 *
 * Example Commands:
 *    node assembleConfig.js dev debug       // Builds debug APK for dev
 *    node assembleConfig.js uat release     // Builds release APK for uat
 *    node assembleConfig.js prod            // Defaults to release build for prod
 */

const shell = require('shelljs');
const path = require('path');
const dotenv = require('dotenv');
const os = require('os');
const fs = require('fs');

// Supported environments and build types
const validEnvs = ['dev', 'uat', 'prod'];
const validBuildTypes = ['release', 'debug'];

// Parse CLI arguments
const args = process.argv.slice(2);
if (args.length < 1 || args.length > 2) {
  console.error('❌ Usage: node assembleConfig.js <environment> [buildType]');
  process.exit(1);
}

const env = args[0];
const buildType = (args[1] || 'release').toLowerCase(); // Defaults to 'release'

// Validate inputs
if (!validEnvs.includes(env)) {
  console.error(`❌ Invalid environment: ${env}. Must be one of: ${validEnvs.join(', ')}`);
  process.exit(1);
}
if (!validBuildTypes.includes(buildType)) {
  console.error(`❌ Invalid build type: ${buildType}. Must be one of: ${validBuildTypes.join(', ')}`);
  process.exit(1);
}

console.log(`✅ Building for environment: ${env}, type: ${buildType}`);

// Load environment-specific .env file
const envFile = path.resolve(__dirname, `.env.${env}`);
if (!shell.test('-f', envFile)) {
  console.error(`❌ Missing env file: ${envFile}`);
  process.exit(1);
}
dotenv.config({ path: envFile });
console.log(`📦 Loaded environment variables from: .env.${env}`);

// Clean previous bundle and build artifacts
shell.echo('🧹 Cleaning previous builds...');
shell.rm('-rf', `android/app/src/${env}/assets/index.android.bundle`);
shell.rm('-rf', 'android/app/build');

// Ensure required asset/res directories exist
shell.mkdir('-p', `android/app/src/${env}/assets`);
shell.mkdir('-p', `android/app/src/${env}/res`);

// Bundle JavaScript using React Native CLI
console.log('📦 Bundling JavaScript...');
const isDev = buildType === 'debug';
const bundleCmd = `npx env-cmd -f .env.${env} react-native bundle \
  --platform android \
  --dev ${isDev} \
  --entry-file index.js \
  --bundle-output android/app/src/${env}/assets/index.android.bundle \
  --assets-dest android/app/src/${env}/res`;

if (shell.exec(bundleCmd).code !== 0) {
  console.error('❌ JavaScript bundling failed');
  process.exit(1);
}

// Run Gradle build command
console.log(`Running Gradle assemble task for ${env}/${buildType}...`);
const gradleCmd = os.platform() === 'win32' ? 'gradlew.bat' : './gradlew';
const flavor = env.charAt(0).toUpperCase() + env.slice(1);           // Capitalize first letter (e.g., Dev, Uat, Prod)
const typeCap = buildType.charAt(0).toUpperCase() + buildType.slice(1); // Capitalize buildType (e.g., Debug, Release)
const assembleTask = `assemble${flavor}${typeCap}`;                  // e.g., assembleDevRelease

shell.cd('android');
if (shell.exec(`${gradleCmd} ${assembleTask}`).code !== 0) {
  console.error('❌ Gradle build failed');
  process.exit(1);
}
shell.cd('..');

// Locate the generated APK file
console.log('🔍 Searching for generated APK...');
const apkDir = path.join('android', 'app', 'build', 'outputs', 'apk', env, buildType);
let apkFile = '';

if (shell.test('-d', apkDir)) {
  const files = fs.readdirSync(apkDir);
  const apkCandidates = files.filter(file => file.endsWith('.apk'));
  if (apkCandidates.length > 0) {
    apkFile = path.join(apkDir, apkCandidates[0]);
    console.log(`✅ Found APK: ${apkFile}`);
  }
}

if (!apkFile || !fs.existsSync(apkFile)) {
  console.error(`❌ APK not found in ${apkDir}`);
  process.exit(1);
}

// Handle output: CI (Bitrise) or local install
const deployDir = process.env.BITRISE_DEPLOY_DIR;

if (deployDir) {
  // For CI/CD (e.g., Bitrise) - Copy APK to deploy directory
  console.log(`📤 Copying APK to Bitrise deploy directory: ${deployDir}`);
  const target = path.join(deployDir, path.basename(apkFile));
  if (shell.cp(apkFile, target).code !== 0) {
    console.error('❌ Failed to copy APK to deploy directory');
    process.exit(1);
  }
  console.log(`✅ APK ready for download: ${target}`);
} else {
  // For local development - Install APK on connected device via ADB
  console.log('📲 Installing APK on connected device...');
  if (shell.exec(`adb install -r ${apkFile}`).code !== 0) {
    console.error('❌ APK installation failed. Ensure a device is connected and USB debugging is enabled.');
    process.exit(1);
  }
}

// Final success message
console.log(`✅ ✅ ✅ Build completed: ${env} (${buildType})`);
console.log(`📂 APK location: ${apkFile}`);
