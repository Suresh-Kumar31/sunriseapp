# Sun Alarm

Offline sunrise/sunset alarm app built with Vue 3 + Capacitor.

## What it does

- Calculates sunrise and sunset offline using latitude, longitude, and date.
- Saves GPS/manual location locally.
- Shows next 7 days sunrise/sunset.
- Schedules local Android notifications before sunrise/sunset.

## Local web preview

```bash
npm install
npm run dev
```

## Local APK build, only if Android tools are installed

```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

APK path:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Cloud APK build using GitHub Actions

Push this repo to GitHub. The workflow will generate a debug APK artifact.

