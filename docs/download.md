# Rove — Required Downloads & Setup

## System Dependencies (Arch Linux)

```bash
# Core tools
sudo pacman -S wmctrl xdotool imagemagick ffmpeg

# Wayland support (if not using Xorg)
sudo pacman -S ydotool

# For cloudflared tunneling
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

## Wayland Daemon (required for click/keyboard on Wayland)

```bash
# Run once at startup (add to ~/.profile or autostart)
sudo chmod +666 /dev/uinput
ydotoold &
```

> **Tip**: For best results (full screen view + interaction), log out and select **GNOME on Xorg** at the login screen.

---

## AI (Local LLM)

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull gemma3
```

## Tunnel (Remote Access from Phone)

```bash
# Install cloudflared (from AUR or official)
yay -S cloudflared

# Or download binary:
# https://github.com/cloudflare/cloudflared/releases

# Start tunnel
cloudflared tunnel --url http://localhost:4242
```

---

## Node.js / pnpm

```bash
# Install nvm + node
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
nvm install 20

# Install pnpm
npm install -g pnpm
```