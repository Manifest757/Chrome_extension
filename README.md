# ScreenCap — Chrome Extension

Screenshot the visible area, capture full-page scrolling screenshots, or record your tab/screen as video. Everything downloads instantly.

## Features

- **Visible Area Screenshot** — captures what's currently on screen (PNG or JPEG)
- **Full Page Screenshot** — scrolls and stitches the entire page into one image
- **Tab Recording** — records the current tab as a `.webm` video (with audio)
- **Screen Recording** — pick any window, tab, or your entire screen to record

## Installation

1. Unzip the `screencap-extension.zip` file
2. Open **Chrome** and go to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the unzipped `screencap-extension` folder
6. The ScreenCap icon will appear in your toolbar — pin it for quick access

## Usage

Click the extension icon to open the popup:

- **PNG / JPEG** — toggle the format for screenshots
- **Visible Area** — one-click capture of the current viewport
- **Full Page** — captures the entire scrollable page (stay still while it works!)
- **Record Tab** — starts/stops recording the active tab
- **Record Screen** — lets you pick a screen or window to record

All files download automatically to your default downloads folder.

## Notes

- Full-page capture works best on static pages. Lazy-loaded content or infinite scroll pages may produce gaps.
- Tab recording captures tab audio if available. Screen recording does not capture system audio (Chrome limitation).
- Recordings are saved as `.webm` files — playable in Chrome, VLC, and most modern players.
- The extension requires Chrome 116+ for full Manifest V3 offscreen document support.

## Permissions Explained

| Permission | Why |
|---|---|
| `activeTab` | Access the current tab to capture it |
| `scripting` | Inject scroll logic for full-page capture |
| `downloads` | Save screenshots and recordings |
| `tabCapture` | Record tab video/audio |
| `desktopCapture` | Let user pick a screen/window to record |
| `offscreen` | Run canvas stitching and MediaRecorder in background |
