# Remote Screen View — Final Technical Plan

See, click, scroll, drag, and type on your PC from any device.

---

## Confirmed Features (Based on Decisions)

| Feature | Decision |
|---|---|
| View screen | ✅ Yes |
| Click | ✅ Yes |
| Scroll (swipe = scroll wheel) | ✅ Yes |
| Right-click (long press) | ✅ Yes |
| Drag (press-hold + move) | ✅ Yes |
| Custom on-screen keyboard | ✅ Yes (not phone's default) |
| Keyboard auto-show | ✅ Yes, when tapping text fields |
| FPS selector | ✅ Yes, selectable per device |
| Monitor switcher | ✅ Yes |
| App Switcher (all windows) | ✅ Yes |
| Cross-platform (Linux/Mac/Win) | ✅ Yes |
| Device-aware UI scaling | ✅ Yes (auto-detects phone/tablet/mini-PC) |
| Re-auth before interaction | ❌ No (just on first login) |

---

## Cross-Platform Backend Strategy

The tricky part is **Arch Linux, macOS, and Windows all have different tools.**
The backend detects the OS and uses the right tool automatically.

```
OS Detection → platform = process.platform
  'linux'  → use xdotool, import, ffmpeg, wmctrl
  'darwin' → use screencapture, cliclick, ffmpeg, osascript
  'win32'  → use nircmd, powershell, ffmpeg
```

### Linux (Arch)
```bash
# Screenshot
import -window root -crop 2240x1080+0+0 /tmp/screen.jpg

# Mouse click
xdotool mousemove 960 540 click 1

# Right-click
xdotool mousemove 960 540 click 3

# Scroll down
xdotool mousemove 960 540 click 5      # 4 = scroll up, 5 = scroll down

# Drag (mousedown → move → mouseup)
xdotool mousemove X1 Y1 mousedown 1 mousemove X2 Y2 mouseup 1

# Type text
xdotool type "hello"

# Special key
xdotool key Return

# List windows
wmctrl -l

# Live stream
ffmpeg -video_size 2240x1080 -offset_x 0 -framerate 15 -f x11grab :0.0 -vf scale=960:-1 -vcodec mjpeg -f image2pipe pipe:1
```

### macOS
```bash
# Screenshot
screencapture -x /tmp/screen.jpg

# Mouse click
cliclick c:960,540

# Right-click
cliclick rc:960,540

# Scroll
cliclick dd:960,540    # + osascript scroll events

# List windows
osascript -e 'tell application "System Events" to get name of every window of every process'

# Live stream
ffmpeg -f avfoundation -i "1" -vf scale=960:-1 -vcodec mjpeg -f image2pipe pipe:1
```

### Windows
```bash
# Screenshot + Live stream
ffmpeg -f gdigrab -i desktop -vf scale=960:-1 -vcodec mjpeg -f image2pipe pipe:1

# Mouse click
nircmd.exe sendmouse 960 540 left click

# List windows
powershell "Get-Process | Where-Object {$_.MainWindowTitle -ne ''} | Select MainWindowTitle"
```

---

## Architecture

```
Phone/Tablet/Mini-PC Browser
         │
         │  ← Backend auto-detects OS on startup
         │
         ├── GET /api/system/screen/info
         │     Returns: { monitors: [{w, h, offset}], os, defaultFps }
         │     Client reads this and scales coordinates correctly
         │
         ├── GET /api/system/screen/capture?monitor=0&quality=80
         │     Returns JPEG image buffer
         │     Used in Polling mode (every N seconds you set)
         │
         ├── WebSocket /ws/screen?monitor=0&fps=15&token=...
         │     Backend runs ffmpeg → pipes JPEG frames → sends as binary
         │     Used in Live mode
         │
         ├── POST /api/system/screen/interact
         │     Body: { type, x, y, dx?, dy?, text?, key? }
         │     type = 'click' | 'rightclick' | 'scroll' | 'dragstart' | 'dragmove' | 'dragend' | 'type' | 'key'
         │
         ├── GET /api/system/screen/windows
         │     Returns: [{ id, title, pid, app }]
         │
         └── POST /api/system/screen/focus
               Body: { windowId: "..." }
```

---

## Coordinate Translation

The phone doesn't know the PC screen size. The backend sends it on load.

```typescript
// On page load:
const { monitors } = await api.get('/system/screen/info')
const monitor = monitors[selectedMonitor]  // e.g. { w: 2240, h: 1080, offsetX: 0 }

// On touch:
const rect = screenContainer.getBoundingClientRect()
const relX = (touchX - rect.left) / rect.width    // 0.0 to 1.0
const relY = (touchY - rect.top) / rect.height    // 0.0 to 1.0

// Real PC coordinates
const pcX = Math.round(relX * monitor.w) + monitor.offsetX
const pcY = Math.round(relY * monitor.h)
```

This works for **any device** — phone, tablet, mini-PC — because it always uses percentages, never fixed pixels.

---

## Frontend — Screen Page UI

```
┌──────────────────────────────────────────┐
│ ← Back   [Mon 0] [Mon 1]   [⚡ Live ▼]  │  ← Top bar
├──────────────────────────────────────────┤
│                                          │
│   PC screen goes here                   │  ← Scaled to fit
│   (touch events translated to PC coords)│
│                                          │
├──────────────────────────────────────────┤
│  [⌨]  [Apps ⊞]  Polling: [5s ▼]        │  ← Bottom bar
└──────────────────────────────────────────┘
```

### Touch Gesture Mapping
| Phone Gesture | PC Action |
|---|---|
| Single tap | Left click |
| Long press (500ms) | Right click |
| Long press + drag | Click and drag |
| Two-finger swipe up | Scroll up |
| Two-finger swipe down | Scroll down |
| Tap on text area | Open custom keyboard |

### FPS / Quality Settings (saved per device)
```
Eco      → Polling every 5s (almost no data)
Balanced → Polling every 1s
Fast     → Live stream at 10fps
Ultra    → Live stream at 24fps (strong phone/tablet)
```
Saved in `localStorage` so each device remembers its preference.
The user can change the fps and quality settings (saved per device) from the settings section

### Custom Keyboard
- Built inside the app (not the phone's native keyboard).
- Has QWERTY layout + a "Special Keys" row: `Esc`, `Tab`, `Ctrl`,`Alt`, `Alt gr`, `⌘/Win`, `↑↓←→`, `F1–F12` and `Ech`. 
- Appears as a slide-up panel when the user taps inside a text field on the screen.
- Has a "type" button or press Enter to send.

### App Switcher (tap "Screen" nav button again)
- Shows a grid of all open windows (title + icon/emoji per OS).
- Tap one → backend focuses that window → screen updates to show it.

---

## Device Size Awareness

The frontend reads the device's actual screen size and DPR (device pixel ratio) on load:

```typescript
const deviceW = window.screen.width * window.devicePixelRatio
const deviceH = window.screen.height * window.devicePixelRatio
const isTablet = deviceW >= 1024  // different layout for tablets
const isMiniPc = deviceW >= 1280  // even wider layout
```

The screen view container uses `100vw × (100vh - topBar - bottomBar)` so it always fills the available display perfectly, regardless of device.

---

## Files to Create/Modify

| # | File | Action |
|---|---|---|
| 1 | `server/src/screen/screen.service.ts` | NEW — OS detection + all commands |
| 2 | `server/src/screen/screen.routes.ts` | NEW — REST + WebSocket endpoints |
| 3 | `server/src/index.ts` | MODIFY — register screen routes |
| 4 | `client/src/app/screen/page.tsx` | NEW — main screen viewer page |
| 5 | `client/src/components/AppSwitcher.tsx` | NEW — window list modal |
| 6 | `client/src/components/RemoteKeyboard.tsx` | NEW — custom keyboard |
| 7 | `client/src/app/dashboard/page.tsx` | MODIFY — add Screen nav button |

**7 files total (5 new, 2 modified).**
