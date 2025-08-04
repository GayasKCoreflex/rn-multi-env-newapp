# React Native Salesforce Multi-Environment App

A React Native application with Salesforce integration, featuring automated multi-environment builds and CI/CD pipeline support.

## 🚀 Quick Start

To get started, run the following from the project root directory:

```bash
# For Android setup  
node ./installandroid.js
```

## 📱 Multi-Environment Build System

This project includes a unified Node.js automation script (`assembleConfig.js`) that streamlines the bundle, build, and install process for React Native Android with support for multiple environments.

### Usage

```bash
node assembleConfig.js <environment> [buildType]
```

### Examples

```bash
# Development debug build
node assembleConfig.js dev debug

# UAT release build
node assembleConfig.js uat release

# Production release build (default)
node assembleConfig.js prod
```

## 🏗️ Supported Configurations

### Environments
- **`dev`** - Development environment
- **`uat`** - User Acceptance Testing environment  
- **`prod`** - Production environment

### Build Types
- **`release`** (default) - Optimized production build
- **`debug`** - Development build with debugging enabled

## ⚙️ Environment Configuration

Each environment uses its own `.env` file for configuration:

### `.env.dev`
```env
ENV=development
API_URL=https://dev-api.example.com
SALESFORCE_URL=https://dev.salesforce.com
```

### `.env.uat`
```env
ENV=uat
API_URL=https://uat-api.example.com
SALESFORCE_URL=https://uat.salesforce.com
```

### `.env.prod`
```env
ENV=production
API_URL=https://api.example.com
SALESFORCE_URL=https://production.salesforce.com
```

## 🔄 Build Process Features

The `assembleConfig.js` script automatically handles:

1. **Environment Loading** - Loads the appropriate `.env` file using `dotenv` and `env-cmd`
2. **JS Bundling** - Bundles JavaScript to `android/app/src/<env>/assets/index.android.bundle`
3. **Asset Management** - Places assets in `android/app/src/<env>/res`
4. **Gradle Build** - Executes Gradle task: `assemble<Env><BuildType>` (e.g., `assembleUatRelease`)
5. **APK Generation** - Outputs APK named as `redone-<env>-<buildType>.apk`
6. **Device Installation** - Installs APK to connected Android device using `adb` (local builds)
7. **CI/CD Support** - Copies APK to Bitrise deploy directory for artifact download

## 📋 App Configuration

| Environment | App ID | App Name | APK Name |
|-------------|--------|----------|----------|
| Development | `com.coreflex.sfapp.dev` | RedOneDev | `redone-dev-release.apk` |
| UAT | `com.coreflex.sfapp.uat` | RedOneUAT | `redone-uat-release.apk` |
| Production | `com.coreflex.sfapp` | RedOne | `redone-prod-release.apk` |

## 🛠️ Prerequisites

### Required Dependencies

```bash
# Install development dependencies
npm install --save-dev shelljs dotenv env-cmd

# Install React Native Config
npm install react-native-config
```

### Development Tools
- Node.js (v18+)
- Android Studio with SDK
- React Native CLI
- Java 17 (for Android builds)

## 📁 Project Structure

```
├── assembleConfig.js           # Main build automation script
├── installandroid.js          # Android setup script
├── installios.js              # iOS setup script
├── .env.dev                   # Development environment config
├── .env.uat                   # UAT environment config
├── .env.prod                  # Production environment config
├── package.json               # Node.js dependencies
├── android/
│   ├── app/
│   │   ├── build.gradle       # Android build configuration
│   │   └── src/
│   │       ├── dev/           # Development-specific assets
│   │       ├── uat/           # UAT-specific assets
│   │       └── prod/          # Production-specific assets
│   ├── build.gradle           # Root Android build file
│   └── gradle.properties      # Gradle build settings
├── ios/                       # iOS project files
├── src/                       # React Native source code
└── bitrise.yml               # CI/CD configuration
```

## 🤖 CI/CD Integration (Bitrise)

The project includes automated CI/CD with Bitrise for building and deploying APKs.

### Available Workflows
- **`dev`** - Builds development APK
- **`uat`** - Builds UAT APK  
- **`prod`** - Builds production APK

### Bitrise Build Commands
```yaml
# Development build
node assembleConfig.js dev release

# UAT build  
node assembleConfig.js uat release

# Production build
node assembleConfig.js prod release
```

### Workflow Features
- Automated dependency installation
- Environment validation
- Build caching for faster builds
- Artifact deployment
- Error handling and notifications









---

**Note**: This project uses React Native with Salesforce Mobile SDK. Ensure you have the proper Salesforce developer credentials and configurations before building.
