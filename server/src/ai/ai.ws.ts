import { FastifyInstance, FastifyRequest } from 'fastify';
import { askAi } from './ai.service.js';
import { verifyToken } from '../auth/auth.service.js';

export async function aiWs(fastify: FastifyInstance) {
    fastify.get('/ws/ai', { websocket: true }, (connection, req: FastifyRequest) => {
        const { socket } = connection;

        const token = req.cookies.token || (req.query as any).token;
        if (!token || !verifyToken(token)) {
            socket.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
            socket.close();
            return;
        }

        socket.on('message', async (message) => {
            try {
                const msg = JSON.parse(message.toString());
                if (msg.type === 'message') {
                    await askAi(msg.content, (chunk) => {
                        socket.send(JSON.stringify({ type: 'chunk', content: chunk }));
                    }).then((result) => {
                        socket.send(JSON.stringify({ type: 'done', content: result.content, commands: result.commands }));
                    });
                }
            } catch (err) {
                console.error('AI WS Error:', err);
            }
        });
    });
}
