# Android Mobile App (PWA & Signed APK Packaging Guide)

## 1. Instant Zero-Download Android App (PWA — Ready Today)
`apps/web/public/manifest.webmanifest` is configured so any citizen or field worker on Android Chrome can tap **Menu (⋮) → Install App / Add to Home Screen** to install **Betul 48** as a standalone mobile app with offline draft support and voice input.

## 2. Building a Native Android APK (`betul-district.apk`) with Capacitor
To distribute an installable `.apk` or publish to Google Play:

```bash
cd apps/web
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Betul District" "in.gov.mp.betul.intelligence" --web-dir dist
npm run build
npx cap add android
npx cap sync android
cd android && ./gradlew assembleRelease
```

The signed APK will be generated at `apps/web/android/app/build/outputs/apk/release/app-release.apk`.

## 3. Architectural Note on `google-research/google-research` (`android_control`) & Voice Guidance
- **`google-research/google-research` (`android_control`)** is a research dataset (15,000+ demonstrations & accessibility trees) for training GUI agents — it is **not** a production Android SDK for remotely controlling citizens' devices.
- Google Play policies strictly restrict external device control via `AccessibilityService` to genuine accessibility tools with explicit user consent.
- **Recommended Production Pattern for Betul Citizens:**
  1. **In-App Voice Navigation + STT** (`gpt-transcribe` / Whisper / Bhashini / Web Speech API) to fill forms and navigate directly inside the Betul Android app.
  2. **Hindi/English Text-to-Speech (TTS)** to read eligibility results and next steps aloud for low-literacy users.
  3. **Android App Actions / Deep Links** (`betul://schemes`, `betul://assistant`) so Google Assistant can open Betul features seamlessly without invasive device control permissions.
