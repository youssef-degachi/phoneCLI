import { spawn, ChildProcess } from 'child_process';
import { env, config } from '../config.js';
import fs from 'fs';
import path from 'path';

export interface TunnelStatus {
    alive: boolean;
    url: string;
    restarts: number;
    uptime: number;
}

let tunnelProcess: ChildProcess | null = null;
let tunnelUrl = '';
let restartCount = 0;
let startTime = 0;

const logFile = path.resolve(process.cwd(), '../tunnel.log');

export const startTunnel = () => {
    if (tunnelProcess) return;

    const args = ['tunnel', '--url', `http://localhost:${env.PORT}`];
    if (env.CLOUDFLARE_TUNNEL_TOKEN) {
        args.push('run', '--token', env.CLOUDFLARE_TUNNEL_TOKEN);
    }

    tunnelProcess = spawn('cloudflared', args);
    startTime = Date.now();

    tunnelProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        fs.appendFileSync(logFile, output);

        // Extract URL: matches https://*.trycloudflare.com
        const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
        if (match) {
            tunnelUrl = match[0];
            console.log(`📡 Tunnel live at: ${tunnelUrl}`);
        }
    });

    tunnelProcess.stderr?.on('data', (data) => {
        const output = data.toString();
        fs.appendFileSync(logFile, output);

        const match = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
        if (match) {
            tunnelUrl = match[0];
            console.log(`📡 Tunnel live at: ${tunnelUrl}`);
        }
    });

    tunnelProcess.on('exit', (code) => {
        console.error(`⚠️ Tunnel exited with code ${code}`);
        tunnelProcess = null;
        tunnelUrl = '';

        if (config.tunnel.autoRestart && restartCount < config.tunnel.maxRestarts) {
            restartCount++;
            console.log(`🔄 Restarting tunnel in ${config.tunnel.restartDelayMs}ms... (Attempt ${restartCount})`);
            setTimeout(startTunnel, config.tunnel.restartDelayMs);
        }
    });
};

export const getTunnelStatus = (): TunnelStatus => ({
    alive: tunnelProcess !== null,
    url: tunnelUrl,
    restarts: restartCount,
    uptime: tunnelProcess ? Date.now() - startTime : 0,
});

export const stopTunnel = () => {
    if (tunnelProcess) {
        tunnelProcess.kill();
        tunnelProcess = null;
        tunnelUrl = '';
    }
};

// Reset restart count periodically if stable
setInterval(() => {
    if (tunnelProcess && Date.now() - startTime > 10 * 60 * 1000) {
        restartCount = 0;
    }
}, 5 * 60 * 1000);
