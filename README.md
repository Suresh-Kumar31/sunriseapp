# Sun Alarm

Offline sunrise/sunset alarm app built with Vue 3 + Capacitor.

## Expected UI

After the splash/logo screen, the app should show:

- Orange/yellow header titled **Sun Alarm**
- Today's sunrise and sunset cards
- Location section with GPS button and latitude/longitude fields
- Alarm settings for sunrise/sunset and minutes before event
- Next 7 days sunrise/sunset table

## Important fix

`vite.config.js` uses `base: './'`. This is required for Capacitor APK builds so Android WebView can load bundled JS/CSS correctly.

## Cloud APK build using GitHub Actions

Push this repo to GitHub. The workflow will generate a debug APK artifact.
