import * as pty from 'node-pty';
import os from 'os';

export interface TerminalSession {
    id: string;
    pty: pty.IPty;
    lastUsed: number;
}

const sessions = new Map<string, TerminalSession>();

export const createSession = (id: string, cols: number = 80, rows: number = 24): TerminalSession => {
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
        pty: ptyProcess,
        lastUsed: Date.now(),
    };

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

export const destroySession = (id: string) => {
    const session = sessions.get(id);
    if (session) {
        session.pty.kill();
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
