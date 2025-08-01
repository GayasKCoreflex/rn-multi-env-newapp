/**
 * BBai - Bundle-Build-Assemble Script (Bitrise Artifact)
 *
 * Usage:
 *    node BBai-android.js <environment> [buildType]
 *
 * Example:
 *    node BBai-android.js dev debug
 *    node BBai-android.js uat release
 *    node BBai-android.js prod
 *
 * Behavior:
 * - Loads .env.<environment>
 * - Bundles JS
 * - Builds APK via Gradle
 * - Skips installing APK
 * - Copies APK to $BITRISE_DEPLOY_DIR (for Bitrise)
 */

const shell = require('shelljs');
const path = require('path');
const dotenv = require('dotenv');
const os = require('os');

// Supported environments and build types
const validEnvs = ['dev', 'uat', 'prod'];
const validBuildTypes = ['release', 'debug'];

// Parse CLI args
const args = process.argv.slice(2);
if (args.length < 1 || args.length > 2) {
  console.error('❌ Usage: node BBai-android.js <environment> [buildType]');
  process.exit(1);
}
const env = args[0];
const buildType = (args[1] || 'release').toLowerCase();

// Validate
if (!validEnvs.includes(env)) {
  console.error(`❌ Invalid environment: ${env}. Must be one of: ${validEnvs.join(', ')}`);
  process.exit(1);
}
if (!validBuildTypes.includes(buildType)) {
  console.error(`❌ Invalid build type: ${buildType}. Must be one of: ${validBuildTypes.join(', ')}`);
  process.exit(1);
}
console.log(`✅ Building for environment: ${env}, buildType: ${buildType}`);

// Load env vars
const envFile = path.resolve(__dirname, `.env.${env}`);
if (!shell.test('-f', envFile)) {
  console.error(`❌ Missing env file: ${envFile}`);
  process.exit(1);
}
dotenv.config({ path: envFile });
console.log(`📦 Loaded environment variables from .env.${env}`);

// Clean previous outputs
shell.echo('🧹 Cleaning previous builds...');
shell.rm('-rf', `android/app/src/${env}/assets/index.android.bundle`);
shell.rm('-rf', 'android/app/build');

// Create required dirs
shell.mkdir('-p', `android/app/src/${env}/assets`);
shell.mkdir('-p', `android/app/src/${env}/res`);

// Bundle JS
console.log('📦 Bundling JavaScript...');
const isDev = buildType === 'debug';
const bundleCmd = `npx env-cmd -f .env.${env} react-native bundle \
  --platform android \
  --dev ${isDev} \
  --entry-file index.js \
  --bundle-output android/app/src/${env}/assets/index.android.bundle \
  --assets-dest android/app/src/${env}/res`;

if (shell.exec(bundleCmd).code !== 0) {
  console.error('❌ JS bundling failed');
  process.exit(1);
}

// Assemble APK
console.log(`🏗️  Running Gradle assemble for ${env}/${buildType}...`);
const gradleCmd = os.platform() === 'win32' ? 'gradlew.bat' : './gradlew';
const flavor = env.charAt(0).toUpperCase() + env.slice(1);
const typeCap = buildType.charAt(0).toUpperCase() + buildType.slice(1);
const assembleTask = `assemble${flavor}${typeCap}`;

shell.cd('android');
if (shell.exec(`${gradleCmd} ${assembleTask}`).code !== 0) {
  console.error('❌ Gradle build failed');
  process.exit(1);
}
shell.cd('..');

// Determine APK path
const apkRelative = `android/app/build/outputs/apk/${env}/${buildType}/app-${env}-${buildType}.apk`;
const apkPath = path.resolve(__dirname, apkRelative);

if (!shell.test('-f', apkPath)) {
  console.error(`❌ APK not found at ${apkPath}`);
  process.exit(1);
}

// Copy to Bitrise deploy dir
const deployDir = process.env.BITRISE_DEPLOY_DIR;
if (deployDir) {
  const targetPath = path.join(deployDir, `redone-${env}-${buildType}.apk`);
  console.log(`📤 Copying APK to Bitrise deploy dir: ${targetPath}`);
  if (shell.cp(apkPath, targetPath).code !== 0) {
    console.error('❌ Failed to copy APK to deploy dir');
    process.exit(1);
  }
  console.log(`✅ APK available for Bitrise deploy: ${targetPath}`);
} else {
  console.log(`📂 Local build complete. APK located at:\n${apkPath}`);
}

console.log('✅ ✅ ✅ Build process complete without installing the APK.');
