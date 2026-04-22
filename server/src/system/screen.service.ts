import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

export interface WindowInfo {
    id: string;
    title: string;
}

export class ScreenService {
    private static instance: ScreenService;
    private isLinux = process.platform === 'linux';

    public static getInstance() {
        if (!ScreenService.instance) {
            ScreenService.instance = new ScreenService();
        }
        return ScreenService.instance;
    }

    // Capture screenshot of a specific monitor
    // Assumes dual monitor setup: 2240x1080 each (detected 4480x1080 total)
    async captureMonitor(monitor: number = 0): Promise<Buffer> {
        const tempPath = path.join('/tmp', `rove_screen_${monitor}.jpg`);
        const offsetX = monitor * 2240;

        try {
            const isWayland = process.env.XDG_SESSION_TYPE === 'wayland';

            if (isWayland) {
                // Try gnome-screenshot first
                try {
                    await execAsync(`gnome-screenshot --file=${tempPath}`);
                } catch (e) {
                    // Fallback to ffmpeg one-frame grab (works if XWayland is active)
                    await execAsync(`ffmpeg -y -f x11grab -video_size 2240x1080 -i :0.0+${offsetX},0 -frames:v 1 ${tempPath}`);
                }
            } else {
                await execAsync(`import -window root -crop 2240x1080+${offsetX}+0 +repage ${tempPath}`);
            }

            const data = await fs.readFile(tempPath);
            await fs.unlink(tempPath).catch(() => { });
            return data;
        } catch (err) {
            console.error('Screenshot error:', err);
            // Return a placeholder or throw
            throw new Error('Failed to capture screen. If on Wayland, ensure X11 apps are visible or switch to Xorg.');
        }
    }

    async getOpenWindows(): Promise<WindowInfo[]> {
        if (!this.isLinux) return [];
        try {
            // Try wmctrl first
            const { stdout } = await execAsync('wmctrl -l').catch(() => ({ stdout: '' }));
            if (stdout) {
                return stdout.trim().split('\n').map(line => {
                    const parts = line.split(/\s+/);
                    const id = parts[0];
                    const title = parts.slice(3).join(' ');
                    return { id, title };
                }).filter(w => w.title && w.title !== 'N/A');
            }

            // Fallback for Wayland (GNOME): Try to list via D-Bus if possible
            // Note: This often requires specific permissions
            return [];
        } catch (err) {
            return [];
        }
    }

    async interact(event: {
        type: 'click' | 'rightclick' | 'doubleclick' | 'mousemove' | 'type' | 'key' | 'scroll';
        x?: number;
        y?: number;
        monitor?: number; // Added monitor index for scaling
        text?: string;
        key?: string;
        direction?: 'up' | 'down';
    }) {
        let cmd = '';

        // Wayland support using ydotool
        // User primary monitor: 2240x1080. Total dual: 4480x1080.
        const isWayland = process.env.XDG_SESSION_TYPE === 'wayland' || !!process.env.WAYLAND_DISPLAY;
        const monitorOffset = (event.monitor || 0) * 2240;
        const absX = (event.x || 0) + monitorOffset;
        const absY = event.y || 0;

        // Common environment for capture/interaction
        const env = `DISPLAY=:0 XDG_RUNTIME_DIR=/run/user/1000 DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus`;

        switch (event.type) {
            case 'mousemove':
                cmd = isWayland
                    ? `ydotool mousemove -a -- ${absX} ${absY}`
                    : `xdotool mousemove ${absX} ${absY}`;
                break;
            case 'click':
                if (isWayland) {
                    await execAsync(`ydotool mousemove -a -- ${absX} ${absY}`);
                    cmd = `ydotool click 0xC1`; // Left click
                } else {
                    cmd = `xdotool mousemove ${absX} ${absY} click 1`;
                }
                break;
            case 'rightclick':
                if (isWayland) {
                    await execAsync(`ydotool mousemove -a -- ${absX} ${absY}`);
                    cmd = `ydotool click 0xC2`; // Right click
                } else {
                    cmd = `xdotool mousemove ${absX} ${absY} click 3`;
                }
                break;
            case 'type':
                const safeText = event.text?.replace(/"/g, '\\"');
                cmd = isWayland ? `ydotool type "${safeText}"` : `xdotool type "${safeText}"`;
                break;
            case 'key':
                if (isWayland) {
                    if (event.key === 'Return' || event.key === 'Enter') cmd = `ydotool key 28:1 28:0`;
                    if (event.key === 'Escape') cmd = `ydotool key 1:1 1:0`;
                    if (event.key === 'Tab') cmd = `ydotool key 15:1 15:0`;
                } else {
                    cmd = `xdotool key ${event.key}`;
                }
                break;
            case 'scroll':
                if (isWayland) {
                    const val = event.direction === 'up' ? '120' : '-120';
                    cmd = `ydotool mousemove -w -- 0 ${val}`;
                } else {
                    const button = event.direction === 'up' ? '4' : '5';
                    cmd = `xdotool click ${button}`;
                }
                break;
        }

        if (cmd) {
            try {
                await execAsync(`${env} ${cmd}`);
            } catch (err) {
                console.error('Interaction execution error:', err);
            }
        }
    }

    async focusWindow(windowId: string) {
        if (!this.isLinux) return;
        try {
            await execAsync(`wmctrl -ia ${windowId}`);
        } catch (err) {
            console.error('Focus window error:', err);
        }
    }
}

export const screenService = ScreenService.getInstance();
