# Remote Screen View — Full Technical Plan

Control your PC from your phone as if it were in your hands.
Click, type, switch apps, and see your real desktop — scaled to fit your screen.

---

## What We're Building

A new **"Screen" tab** in Rove that:
- Shows your PC's desktop live on your phone.
- Lets you **tap to click** and **type** on a virtual keyboard.
- Has **two modes**: Polling (every 5s, saves data) and Live (real-time).
- Supports **multiple monitors** — you can switch between them.
- Pressing "Screen" when already on the Screen page opens an **App Switcher** (like the Windows taskbar or macOS Expose) showing all open windows.

---

## Key Fact: Your Setup
Detected resolution: **4480×1080 px** (dual monitor, each 2240×1080).
Tools available on your PC:
- `gnome-screenshot` — takes screenshots
- `import` (ImageMagick) — fast screen capture
- `xdotool` — simulates mouse and keyboard
- `ffmpeg` — encodes live video stream

---

## Architecture

```
Phone Browser
     │
     ├─ HTTP (Polling Mode): GET /api/system/screen/capture?monitor=0
     │       Backend runs gnome-screenshot → sends JPEG → browser shows as <img>
     │       Repeats every 5 seconds
     │
     ├─ WebSocket (Live Mode): /ws/screen?monitor=0
     │       Backend runs ffmpeg in a loop → encodes JPEG frames → sends as base64
     │       Browser renders each frame to a <canvas> at ~10fps
     │
     ├─ Touch Event Translations:
     │       User taps at (200, 400) on phone
     │       Phone display is 390×844
     │       Monitor is 2240×1080
     │       → PC click at: x = (200/390)*2240 = 1149, y = (400/844)*1080 = 512
     │       → POST /api/system/screen/interact { type: "click", x: 1149, y: 512 }
     │       → Backend runs: xdotool mousemove 1149 512 click 1
     │
     └─ App Switcher: GET /api/system/screen/windows
             Backend runs: xdotool search --name "" getwindowname
             Returns list of open windows
             User taps one → POST /api/system/screen/focus { windowId: "..." }
```

---

## Backend Plan

### New Files

#### `server/src/screen/screen.service.ts`
Responsible for all interaction with your PC's display.

```typescript
// Take a screenshot of a specific monitor (0 = left, 1 = right)
captureMonitor(monitor: number): Promise<Buffer>  // returns JPEG buffer

// Get list of all open windows (for the App Switcher)
getOpenWindows(): Promise<{ id: string, title: string, pid: number }[]>

// Click at a specific coordinate on the PC
sendClick(x: number, y: number, button?: 1|2|3): Promise<void>  // xdotool click

// Move mouse (for hover/drag)
sendMouseMove(x: number, y: number): Promise<void>

// Type text
sendType(text: string): Promise<void>  // xdotool type

// Press a special key (Enter, Escape, Ctrl+C, etc.)
sendKey(key: string): Promise<void>  // xdotool key

// Focus a window by its ID
focusWindow(windowId: string): Promise<void>
```

**Screenshot command (Polling):**
```bash
import -window root -crop 2240x1080+0+0 +repage /tmp/screen_0.jpg   # Monitor 0 (left)
import -window root -crop 2240x1080+2240+0 +repage /tmp/screen_1.jpg # Monitor 1 (right)
```

**Live streaming (WebSocket):**
```bash
ffmpeg -video_size 2240x1080 -offset_x 0 -framerate 10 -f x11grab :0.0 \
  -vf scale=960:-1 -vcodec mjpeg -f image2pipe pipe:1
# Sends JPEG frames to stdout → we read them and send over WebSocket
```

#### `server/src/screen/screen.routes.ts`
API endpoints exposed by the backend.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/system/screen/capture` | Returns a JPEG screenshot. Query: `?monitor=0` |
| `GET` | `/api/system/screen/windows` | Returns list of open windows |
| `POST` | `/api/system/screen/interact` | Send click/key/type events |
| `POST` | `/api/system/screen/focus` | Focus a window by ID |
| `WS` | `/ws/screen` | Live frame stream. Query: `?monitor=0&token=...` |

---

## Frontend Plan

### New File: `client/src/app/screen/page.tsx`

#### Layout
```
┌─────────────────────────┐
│  [← Back]  Monitor: [0][1]  [Polling | Live]  │   ← Top bar
├─────────────────────────┤
│                         │
│   PC screen here        │   ← Main view (scaled)
│   (touches converted    │
│    to PC coordinates)   │
│                         │
├─────────────────────────┤
│  [⌨ Keyboard]  [Apps ⊞]  │   ← Bottom toolbar
└─────────────────────────┘
```

#### Coordinate Translation (the most important part)
```typescript
// When user taps the screen container:
const handleTouch = (e: TouchEvent) => {
  const rect = containerRef.current.getBoundingClientRect();
  // Where on the displayed image did they tap? (0.0 to 1.0)
  const relX = (e.touches[0].clientX - rect.left) / rect.width;
  const relY = (e.touches[0].clientY - rect.top) / rect.height;
  
  // Translate to real PC coordinates
  const pcX = Math.round(relX * PC_MONITOR_WIDTH);   // e.g. 2240
  const pcY = Math.round(relY * PC_MONITOR_HEIGHT);  // e.g. 1080
  
  api.post('/system/screen/interact', { type: 'click', x: pcX, y: pcY });
};
```

#### Mode Toggle
- **Polling Mode**: Every 5 seconds, fetch the image endpoint and update an `<img src>`.
- **Live Mode**: Open a WebSocket to `/ws/screen`, receive base64 frames, draw them on a `<canvas>`.

#### App Switcher (Bottom "Apps" button)
- Calls `GET /api/system/screen/windows`.
- Shows a grid/list of window titles.
- Tapping one calls `POST /api/system/screen/focus`.
- Also accessible by tapping "Screen" in the nav bar when already on the screen.

#### Virtual Keyboard
- Shows a simple text input popup.
- On submit, calls `POST /api/system/screen/interact` with `{ type: 'type', text: '...' }`.
- Also supports special keys: `Enter`, `Escape`, `Tab`, `Ctrl+C`, `Ctrl+V`, etc.

---

## Implementation Order

1. `screen.service.ts` — screenshot + xdotool functions.
2. `screen.routes.ts` — REST endpoints (polling first, then WS).
3. `screen/page.tsx` — UI with image display and touch handling.
4. Add "Screen" button to the nav bar in `dashboard/page.tsx`.
5. Add App Switcher modal.
6. Add Live Streaming via WebSocket + `ffmpeg`.
7. Add monitor switcher (for your dual-monitor setup).

---

## Things to Install
```bash
# For listing open windows in the App Switcher:
sudo apt install wmctrl

# (ffmpeg and xdotool are already installed ✅)
```

---

## Quick Summary

| Capability | How |
|---|---|
| See screen | `gnome-screenshot` / `ffmpeg` |
| Click on screen | `xdotool mousemove X Y click 1` |
| Type text | `xdotool type "text"` |
| Press keys | `xdotool key Return` |
| Switch apps | `wmctrl -l` then `xdotool windowfocus` |
| Switch monitor | Crop offset: monitor 0 = `+0+0`, monitor 1 = `+2240+0` |
| Coordinate scale | `pcX = (tapX / displayW) * monitorW` |
| Live stream | `ffmpeg` x11grab → WebSocket → canvas |
