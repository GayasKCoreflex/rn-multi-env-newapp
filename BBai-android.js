/**
 * BBai - Bundle-Build-Assemble-Install Script (All-in-one)
 *
 * Usage:
 *    node BBai-android.js <environment> [buildType]
 *
 * Example:
 *    node BBai-android.js dev debug
 *    node BBai-android.js uat release
 *    node BBai-android.js prod
 *
 * Supported Environments:
 * - dev, uat, prod
 *
 * Supported Build Types:
 * - release (default)
 * - debug
 *
 * Requirements:
 * - Android device must be connected
 * - Install dependencies: npm install shelljs dotenv env-cmd
 */

const shell = require('shelljs');
const path = require('path');
const dotenv = require('dotenv');
const os = require('os');

// Valid environments and build types
const validEnvs = ['dev', 'uat', 'prod'];
const validBuildTypes = ['release', 'debug'];

// Extract CLI arguments
const args = process.argv.slice(2);

// Validate number of arguments
if (args.length < 1 || args.length > 2) {
    console.error('❌ Usage: node BBai-android.js <environment> [buildType]');
    process.exit(1);
}

const env = args[0];
const buildType = (args[1] || 'release').toLowerCase();

// Validate environment
if (!validEnvs.includes(env)) {
    console.error(`❌ Invalid environment: "${env}". Must be one of: ${validEnvs.join(', ')}`);
    process.exit(1);
}

// Validate build type
if (!validBuildTypes.includes(buildType)) {
    console.error(`❌ Invalid buildType: "${buildType}". Must be one of: ${validBuildTypes.join(', ')}`);
    process.exit(1);
}

// Display selected options
console.log(`✅ Environment selected: ${env}`);
console.log(`🔨 Build type selected: ${buildType}`);

// Load corresponding .env file
const envFilePath = path.resolve(__dirname, `.env.${env}`);
if (!shell.test('-f', envFilePath)) {
    console.error(`❌ Environment file not found: ${envFilePath}`);
    process.exit(1);
}
dotenv.config({ path: envFilePath });
console.log(`📦 Loaded env file: .env.${env}`);

// Clean old bundle and build
shell.echo('🧹 Cleaning previous build and bundle...');
shell.rm('-rf', `android/app/src/${env}/assets/index.android.bundle`);
shell.rm('-rf', 'android/app/build');

// Ensure assets and res directories exist
shell.mkdir('-p', `android/app/src/${env}/assets`);
shell.mkdir('-p', `android/app/src/${env}/res`);

// Bundle JS for the selected environment and build type
console.log('📦 Bundling JavaScript...');
const isDevBundle = buildType === 'debug';
const bundleCmd = `npx env-cmd -f .env.${env} react-native bundle \
  --platform android \
  --dev ${isDevBundle} \
  --entry-file index.js \
  --bundle-output android/app/src/${env}/assets/index.android.bundle \
  --assets-dest android/app/src/${env}/res`;

if (shell.exec(bundleCmd).code !== 0) {
    console.error('❌ JS bundling failed.');
    shell.exit(1);
}

// Move to android folder to start Gradle build
console.log(`🏗️  Building ${buildType} APK...`);
shell.cd('android');

// Construct Gradle task name (e.g., assembleDevDebug)
const flavorCap = env.charAt(0).toUpperCase() + env.slice(1);
const buildTypeCap = buildType.charAt(0).toUpperCase() + buildType.slice(1);
const gradleTask = `assemble${flavorCap}${buildTypeCap}`;

// Use appropriate gradle wrapper based on OS
const gradleCmd = os.platform() === 'win32' ? 'gradlew.bat' : './gradlew';

// Run Gradle build
if (shell.exec(`${gradleCmd} ${gradleTask}`).code !== 0) {
    console.error('❌ Build failed.');
    shell.exit(1);
}

// Install APK to connected Android device
console.log('📲 Installing APK on device...');
const apkPath = `app/build/outputs/apk/${env}/${buildType}/redone-${env}-${buildType}.apk`;

// Validate APK existence
if (!shell.test('-f', apkPath)) {
    console.error(`❌ APK not found: ${apkPath}`);
    shell.exit(1);
}

// Install APK using adb
if (shell.exec(`adb install -r ${apkPath}`).code !== 0) {
    console.error('❌ APK installation failed.');
    shell.exit(1);
}

// Final success message
console.log(`✅ ✅ ✅ Build complete and APK installed: [${env}] (${buildType})`);
