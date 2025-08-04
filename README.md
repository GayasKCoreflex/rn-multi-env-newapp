
## To get started do the following from this directory
``` shell
node ./installios.js (for iOS)
node ./installandroid.js (for Android)
```
## Added BBai-android.js script and multi-environment build setup

Introduced a unified Node.js automation script (BBai-android.js) to streamline the bundle, build, and install process for a React Native Android app with support for multiple environments: dev, uat, and prod. This script handles JS bundling, Gradle builds, and APK installation to a connected Android device, with dynamic environment-based configuration.

Key features:
- Supports environments: dev, uat, prod
- Supports build types: release (default) and debug
- Loads corresponding .env file (.env.dev, .env.uat, .env.prod) using dotenv and env-cmd
- Bundles JS to android/app/src/<env>/assets/index.android.bundle
- Places assets in android/app/src/<env>/res
- Builds APK via Gradle task: assemble<Env><BuildType> (e.g., assembleUatRelease)
- Installs APK to connected Android device using adb
- Output APK named as redone-<env>-<buildType>.apk (e.g., redone-uat-release.apk)

.env files format:
.env.dev
ENV=development
API_URL=https:''
SALESFORCE_URL=''

.env.uat
ENV=uat
API_URL=''
SALESFORCE_URL=''

.env.prod
ENV=production
API_URL=https:''
SALESFORCE_URL=''

Gradle configuration updates in android/app/build.gradle:
- Defined flavorDimensions "env"
- Added productFlavors: dev, uat, prod
- Linked flavors to .env files using project.ext.envConfigFiles and dotenv.gradle
- Customized APK name using applicationVariants.all to output redone-<env>-<buildType>.apk
- Included applicationIdSuffix and app_name per flavor

Required dependencies:
- npm install --save-dev shelljs dotenv env-cmd
- npm install react-native-config

Usage:
- node BBai-android.js <env> [buildType]

Examples:
- node BBai-android.js dev debug
- node BBai-android.js uat release
- node BBai-android.js prod

Affected files:
- BBai-android.js (new)
- .env.dev, .env.uat, .env.prod (new)
- android/app/build.gradle (modified)

This setup allows clean, repeatable builds per environment, supports Salesforce login config, and works in both local and CI/CD pipelines.
