import { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { createSession, destroySession, getSession, listSessions, renameSession } from './terminal.manager.js';

export async function terminalRoutes(fastify: FastifyInstance) {
    fastify.get('/', async () => {
        return listSessions();
    });

    fastify.post('/', async (request) => {
        const body = (request.body ?? {}) as { title?: string };
        const id = randomUUID();
        const session = createSession(id, 80, 24, body.title?.trim() || undefined);
        return {
            id: session.id,
            title: session.title,
            createdAt: session.createdAt,
            lastUsed: session.lastUsed,
            pid: session.pty.pid,
        };
    });

    fastify.patch('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = (request.body ?? {}) as { title?: string };
        const session = getSession(id);
        if (!session) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Session not found' } });
        if (typeof body.title === 'string') renameSession(id, body.title.trim());
        return { ok: true };
    });

    fastify.delete('/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const session = getSession(id);
        if (!session) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Session not found' } });
        destroySession(id);
        return { ok: true };
    });
}
