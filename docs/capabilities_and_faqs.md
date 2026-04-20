# Capabilities & FAQs

This guide answers common questions about what Rove can (and cannot) do in its current state.

### 🚀 What can I do with Rove now?
-   **Monitor your PC**: See if your CPU is spiking or if you are running out of RAM while away.
-   **Manage Dev Servers**: Start your React app, stop your database server, or restart a backend script with one tap.
-   **Run Commands**: Execute any terminal command (ls, git push, docker-compose up, etc.) as if you were sitting at your desk.
-   **Browse Files**: Find where a specific config file or log is located.
-   **Local AI**: Ask questions or generate code snippets using your PC's power.

### 📡 Can I use it from a different wifi?
**Yes.** As long as your PC is running the Cloudflare Tunnel command, you can access the URL from any network (cellular data, cafe wifi, etc.) anywhere in the world.

### 🔒 Is it safe?
-   **Encryption**: All traffic through the Cloudflare Tunnel is encrypted via HTTPS.
-   **Access Control**: The app is protected by a PIN and JWT.
-   **Isolation**: The app runs as a standard user process on your PC.
-   **Recommendation**: Use a strong, unique PIN and don't share your tunnel URL publicly.

### 🛑 What happen if Cloudflare Tunnel stops?
If the tunnel process crashes or your internet blinks, the public URL will stop working. You will need to rerun the `cloudflared tunnel` command. If you are using "Quick Tunnels", you will get a **new URL** each time you restart.

### 🖱 Can I see my desktop cursor or open GUI apps?
**No.** Rove is a *Command Center*, not a *Remote Desktop*. It does not stream your video output. You can use it to open GUI apps on your PC (e.g., typing `code .` will open VS Code on your PC monitor), but you won't see the app window inside Rove on your phone.

### 📱 Why use this instead of SSH?
Rove offers a much better mobile experience than standard SSH apps:
-   **Visuals**: High-quality charts and status indicators.
-   **Context**: Quick-access buttons for specific projects.
-   **All-in-one**: Combines terminal, file browsing, and AI in one optimized PWA.
