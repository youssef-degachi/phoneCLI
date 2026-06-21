import * as pty from 'node-pty';
import os from 'os';

const MAX_BUFFER_BYTES = 256 * 1024; // 256 KB of scrollback per session

export interface TerminalSession {
    id: string;
    title?: string;
    pty: pty.IPty;
    lastUsed: number;
    createdAt: number;
    buffer: string[];
    bufferBytes: number;
    pushBuffer: (chunk: string) => void;
}

export interface TerminalSessionInfo {
    id: string;
    title?: string;
    createdAt: number;
    lastUsed: number;
    pid?: number;
}

const sessions = new Map<string, TerminalSession>();

const makePushBuffer = (session: TerminalSession) => (chunk: string) => {
    session.buffer.push(chunk);
    session.bufferBytes += chunk.length;
    while (session.bufferBytes > MAX_BUFFER_BYTES && session.buffer.length > 1) {
        const dropped = session.buffer.shift()!;
        session.bufferBytes -= dropped.length;
    }
};

export const createSession = (id: string, cols: number = 80, rows: number = 24, title?: string): TerminalSession => {
    const shell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : 'bash');

    const ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols,
        rows,
        cwd: process.env.HOME,
        env: process.env as any,
    });

    const session: TerminalSession = {
        id,
        title,
        pty: ptyProcess,
        lastUsed: Date.now(),
        createdAt: Date.now(),
        buffer: [],
        bufferBytes: 0,
        pushBuffer: () => {},
    };
    session.pushBuffer = makePushBuffer(session);

    // Always capture output into the scrollback buffer, even when no client is connected.
    ptyProcess.onData((data) => {
        session.pushBuffer(data);
    });

    sessions.set(id, session);
    return session;
};

export const getSession = (id: string): TerminalSession | undefined => {
    const session = sessions.get(id);
    if (session) {
        session.lastUsed = Date.now();
    }
    return session;
};

export const listSessions = (): TerminalSessionInfo[] =>
    Array.from(sessions.values()).map((s) => ({
        id: s.id,
        title: s.title,
        createdAt: s.createdAt,
        lastUsed: s.lastUsed,
        pid: s.pty.pid,
    }));

export const renameSession = (id: string, title: string) => {
    const session = sessions.get(id);
    if (session) session.title = title;
};

export const destroySession = (id: string) => {
    const session = sessions.get(id);
    if (session) {
        try { session.pty.kill(); } catch { /* already dead */ }
        sessions.delete(id);
    }
};

// Cleanup inactive sessions every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [id, session] of sessions.entries()) {
        if (now - session.lastUsed > 30 * 60 * 1000) { // 30 minutes
            destroySession(id);
        }
    }
}, 5 * 60 * 1000);
