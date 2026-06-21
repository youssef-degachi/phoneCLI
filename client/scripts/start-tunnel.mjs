#!/usr/bin/env node
/**
 * Spawns a Cloudflare quick tunnel pointing at the local Next.js client.
 * Started alongside `next dev` via `pnpm dev:client` so the tunnel comes up
 * with the UI gateway (port 4000) instead of the backend.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const logFile = path.join(projectRoot, 'tunnel.log');

const targetPort = Number(process.env.TUNNEL_TARGET_PORT) || 4000;
const autoRestart = process.env.TUNNEL_AUTO_RESTART !== 'false';
const restartDelayMs = Number(process.env.TUNNEL_RESTART_DELAY_MS) || 3000;
const maxRestarts = Number(process.env.TUNNEL_MAX_RESTARTS) || 10;

let restarts = 0;
let child = null;
let stopping = false;

const logUrlIfPresent = (chunk) => {
    const match = chunk.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
    if (match) {
        console.log(`📡 Tunnel live at: ${match[0]}`);
    }
};

const start = () => {
    if (stopping) return;

    const args = ['tunnel', '--url', `http://localhost:${targetPort}`];
    if (process.env.CLOUDFLARE_TUNNEL_TOKEN) {
        args.push('run', '--token', process.env.CLOUDFLARE_TUNNEL_TOKEN);
    }

    child = spawn('cloudflared', args, { stdio: ['ignore', 'pipe', 'pipe'] });

    child.stdout?.on('data', (data) => {
        const text = data.toString();
        try { fs.appendFileSync(logFile, text); } catch {}
        logUrlIfPresent(text);
    });
    child.stderr?.on('data', (data) => {
        const text = data.toString();
        try { fs.appendFileSync(logFile, text); } catch {}
        logUrlIfPresent(text);
    });

    child.on('exit', (code) => {
        child = null;
        if (stopping) return;
        console.error(`⚠️  cloudflared exited with code ${code}`);
        if (autoRestart && restarts < maxRestarts) {
            restarts += 1;
            console.log(`🔄 Restarting tunnel in ${restartDelayMs}ms (attempt ${restarts}/${maxRestarts})...`);
            setTimeout(start, restartDelayMs);
        }
    });

    child.on('error', (err) => {
        if (err && err.code === 'ENOENT') {
            console.error('❌ cloudflared not found in PATH. Install it: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/');
            stopping = true;
            return;
        }
        console.error('cloudflared spawn error:', err);
    });
};

const shutdown = () => {
    stopping = true;
    if (child) child.kill('SIGTERM');
    process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

start();
