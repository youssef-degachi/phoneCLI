import { FastifyInstance } from 'fastify';
import { verifyPin, signToken } from './auth.service.js';

export async function authRoutes(fastify: FastifyInstance) {
    fastify.post('/login', async (request, reply) => {
        const { pin } = request.body as { pin: string };

        if (!pin) {
            return reply.code(400).send({ error: { code: 'BAD_REQUEST', message: 'PIN is required' } });
        }

        const isValid = await verifyPin(pin);
        if (!isValid) {
            return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Invalid PIN' } });
        }

        const token = signToken({ authorized: true });

        // Set cookie
        reply.setCookie('token', token, {
            path: '/',
            httpOnly: false,   // Must be readable by JS to pass in WebSocket URL
            secure: false,     // Keep false for local + tunnel
            sameSite: 'lax',   // Allows tunnel (cross-site) access
            maxAge: 7 * 24 * 60 * 60, // 7 days
        });

        return { token, expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000 };
    });

    fastify.post('/logout', async (request, reply) => {
        reply.clearCookie('token');
        return { ok: true };
    });

    fastify.get('/verify', async (request, reply) => {
        // This will be protected by middleware, so if we reach here, it's valid
        return { valid: true };
    });
}
