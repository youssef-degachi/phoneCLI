import { FastifyInstance, FastifyRequest } from 'fastify';
import { WebSocket } from 'ws';
import { createSession, getSession, destroySession } from './terminal.manager.js';
import { verifyToken } from '../auth/auth.service.js';

export async function terminalWs(fastify: FastifyInstance) {
    fastify.get('/ws/terminal/:sessionId', { websocket: true }, (connection, req: FastifyRequest) => {
        const { sessionId } = req.params as { sessionId: string };
        const socket = connection.socket;

        // Handshake verification
        const token = req.cookies.token || (req.query as any).token;
        if (!token || !verifyToken(token)) {
            socket.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
            socket.close();
            return;
        }

        let session = getSession(sessionId);
        const isNew = !session;
        if (!session) {
            session = createSession(sessionId);
        }

        const { pty } = session;

        // Replay scrollback so the user sees what happened while disconnected.
        if (!isNew && session.buffer.length > 0) {
            socket.send(JSON.stringify({ type: 'output', data: session.buffer.join('') }));
        }

        // Live PTY output → this client. The manager already buffers in parallel.
        const onData = (data: string) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'output', data }));
            }
        };
        const dataDisposable = pty.onData(onData);

        const onExit = (event: { exitCode: number; signal?: number }) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'exit', code: event.exitCode }));
                socket.close();
            }
            destroySession(sessionId);
        };
        const exitDisposable = pty.onExit(onExit);

        // Handle client input
        socket.on('message', (message) => {
            try {
                const msg = JSON.parse(message.toString());
                if (msg.type === 'input') {
                    pty.write(msg.data);
                    session!.lastUsed = Date.now();
                } else if (msg.type === 'resize') {
                    pty.resize(msg.cols, msg.rows);
                }
            } catch (err) {
                console.error('Terminal WS Error:', err);
            }
        });

        socket.on('close', () => {
            // Keep the PTY alive for reconnect; just detach this socket's listeners.
            dataDisposable.dispose();
            exitDisposable.dispose();
        });
    });
}
