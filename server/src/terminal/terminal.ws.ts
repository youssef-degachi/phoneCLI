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
        if (!session) {
            session = createSession(sessionId);
        }

        const { pty } = session;

        // Send PTY output to client
        const onData = (data: string) => {
            socket.send(JSON.stringify({ type: 'output', data }));
        };
        pty.onData(onData);

        const onExit = (event: { exitCode: number; signal?: number }) => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify({ type: 'exit', code: event.exitCode }));
                socket.close();
            }
            destroySession(sessionId);
        };
        pty.onExit(onExit);

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
            // In v1, we keep the session alive for 30 mins to allow reconnect
            // But we remove the listeners from the PTY for this specific socket
            pty.removeListener('data', onData);
            pty.removeListener('exit', onExit);
        });
    });
}
