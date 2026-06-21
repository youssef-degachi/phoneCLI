import { spawn, ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';

export interface HostTunnel {
    id: string;
    port: number;
    label?: string;
    url: string;
    status: 'starting' | 'running' | 'error' | 'stopped';
    error?: string;
    startedAt: number;
    pid?: number;
}

interface InternalEntry extends HostTunnel {
    process?: ChildProcess;
}

const tunnels = new Map<string, InternalEntry>();

const URL_REGEX = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/;

export const listHostTunnels = (): HostTunnel[] =>
    Array.from(tunnels.values()).map(({ process: _process, ...rest }) => rest);

export const getHostTunnel = (id: string): HostTunnel | null => {
    const entry = tunnels.get(id);
    if (!entry) return null;
    const { process: _process, ...rest } = entry;
    return rest;
};

const portInUse = (port: number) =>
    Array.from(tunnels.values()).some((t) => t.port === port && t.status !== 'stopped' && t.status !== 'error');

export const startHostTunnel = (port: number, label?: string): HostTunnel => {
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error('Port must be an integer between 1 and 65535');
    }

    if (portInUse(port)) {
        throw new Error(`A tunnel for port ${port} is already running`);
    }

    const id = randomUUID();
    const entry: InternalEntry = {
        id,
        port,
        label,
        url: '',
        status: 'starting',
        startedAt: Date.now(),
    };
    tunnels.set(id, entry);

    let child: ChildProcess;
    try {
        child = spawn('cloudflared', ['tunnel', '--url', `http://localhost:${port}`], {
            stdio: ['ignore', 'pipe', 'pipe'],
        });
    } catch (err: any) {
        entry.status = 'error';
        entry.error = err?.message ?? 'Failed to spawn cloudflared';
        return getHostTunnel(id)!;
    }

    entry.process = child;
    entry.pid = child.pid ?? undefined;

    const captureUrl = (chunk: Buffer | string) => {
        const text = chunk.toString();
        if (!entry.url) {
            const match = text.match(URL_REGEX);
            if (match) {
                entry.url = match[0];
                entry.status = 'running';
            }
        }
    };

    child.stdout?.on('data', captureUrl);
    child.stderr?.on('data', captureUrl);

    child.on('error', (err) => {
        entry.status = 'error';
        entry.error = err?.message ?? 'cloudflared error';
    });

    child.on('exit', (code) => {
        if (entry.status !== 'error') {
            entry.status = 'stopped';
            if (code && code !== 0 && !entry.url) {
                entry.error = `cloudflared exited with code ${code}`;
                entry.status = 'error';
            }
        }
        entry.process = undefined;
    });

    return getHostTunnel(id)!;
};

export const stopHostTunnel = (id: string): boolean => {
    const entry = tunnels.get(id);
    if (!entry) return false;
    if (entry.process) entry.process.kill('SIGTERM');
    entry.status = 'stopped';
    entry.process = undefined;
    return true;
};

export const removeHostTunnel = (id: string): boolean => {
    const entry = tunnels.get(id);
    if (!entry) return false;
    if (entry.process) entry.process.kill('SIGTERM');
    tunnels.delete(id);
    return true;
};

// Best-effort cleanup on shutdown.
const killAll = () => {
    for (const entry of tunnels.values()) {
        if (entry.process) entry.process.kill('SIGTERM');
    }
};
process.on('SIGINT', killAll);
process.on('SIGTERM', killAll);
process.on('exit', killAll);
