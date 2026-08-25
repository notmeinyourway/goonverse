# Goonverse — Android Build & Release Guide

## 1. Prerequisites
- JDK 21 (`Java 21`)
- Android SDK 35 (Platform 35, Build Tools 35.0.0)
- Gradle 8.11.1

## 2. Build Commands

### Clean & Run Unit Tests
```bash
cd android
./gradlew testDebugUnitTest
```

### Build Debug APK
```bash
./gradlew assembleDebug
```
Output: `app/build/outputs/apk/debug/app-debug.apk`

### Build Optimized Release APK (R8 / ProGuard Minified)
```bash
./gradlew assembleRelease
```
Output: `app/build/outputs/apk/release/app-release.apk`

## 3. Release Configuration
- `isMinifyEnabled = true` with R8 code shrinking and resource optimization.
- Proguard rules configured in `app/proguard-rules.pro` to keep Gson models, Room entities, and Retrofit interfaces.
- BuildConfig dynamically injects production API endpoint (`https://api.goonverse.app/`).

## 4. Signing for Production Store Distribution
To sign with a dedicated production keystore:
```kotlin
signingConfigs {
    create("release") {
        storeFile = file("path/to/release.keystore")
        storePassword = System.getenv("KEYSTORE_PASSWORD")
        keyAlias = System.getenv("KEY_ALIAS")
        keyPassword = System.getenv("KEY_PASSWORD")
    }
}
```
