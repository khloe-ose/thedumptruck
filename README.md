# Dump Truck

A private, local photo and video organizer for arranging uploads into groups of 20, locking the first item in each group, shuffling, dragging, previewing, and exporting the final order.

## Run locally

You need a recent version of Node.js (20.19+ or 22.12+ recommended).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

### Open on an iPad

Connect the iPad to the same Wi-Fi network as the computer, run `npm run dev`,
then open the `Network` URL printed by Vite in Safari. Keep the terminal running
and allow incoming connections if the computer's firewall asks. The LAN address
can change when the computer reconnects to Wi-Fi, so use the current `Network`
URL shown at startup.

### Install as “The Dump Truck” on iPhone or iPad

The production build is configured as a Progressive Web App with the main logo
as its icon and an offline-cached app shell.

The app deploys automatically to:

**https://khloe-ose.github.io/thedumptruck/**

Open that address in Safari, tap **Share**, choose **Add to Home Screen**, enable
**Open as Web App**, and tap **Add**. The installed app is named **The Dump Truck**.

The current LAN address can also be added to the Home Screen, but it remains
available only while this computer is running the local server on the same
network. Imported media remains in the browser and is not included in the
offline cache; closing or refreshing still clears the active photo session.

## Production check

```bash
npm test
npm run build
npm run preview
```

## Privacy and files

- Photos and videos remain in the browser and are never sent to a server.
- Previews use temporary browser object URLs.
- Refreshing or closing the tab clears the photo session, so export the final order before leaving.
- A renamed ZIP contains copies named for the final sequence; it never changes the originals on your computer.

## Supported formats

JPG/JPEG, PNG, WEBP, HEIC/HEIF, and common browser-supported video formats such as MP4, MOV, M4V, and WEBM. Videos are shown as a static browser-generated thumbnail with their duration; the app does not play, transcode, or upload them. Files that cannot be decoded show a safe fallback card instead of crashing the app.
