import { FastifyInstance } from 'fastify';
import { getTunnelStatus, startTunnel, stopTunnel } from './tunnel.manager.js';
import {
    listHostTunnels,
    getHostTunnel,
    startHostTunnel,
    removeHostTunnel,
} from './host-tunnels.manager.js';

export async function tunnelRoutes(fastify: FastifyInstance) {
    // Primary (auto-managed) tunnel
    fastify.get('/status', async () => {
        return getTunnelStatus();
    });

    fastify.post('/restart', async () => {
        stopTunnel();
        startTunnel();
        return { ok: true };
    });

    // Ad-hoc host tunnels (Run Host feature)
    fastify.get('/hosts', async () => {
        return listHostTunnels();
    });

    fastify.post('/hosts', async (request, reply) => {
        const body = (request.body ?? {}) as { port?: number | string; label?: string };
        const port = typeof body.port === 'string' ? Number(body.port) : body.port;
        if (!port || Number.isNaN(port)) {
            return reply.code(400).send({ error: { code: 'BAD_REQUEST', message: 'port is required' } });
        }
        try {
            const tunnel = startHostTunnel(port, body.label?.trim() || undefined);
            return tunnel;
        } catch (err: any) {
            return reply.code(400).send({ error: { code: 'BAD_REQUEST', message: err?.message ?? 'Failed' } });
        }
    });

    fastify.get('/hosts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const tunnel = getHostTunnel(id);
        if (!tunnel) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Tunnel not found' } });
        return tunnel;
    });

    fastify.delete('/hosts/:id', async (request, reply) => {
        const { id } = request.params as { id: string };
        const ok = removeHostTunnel(id);
        if (!ok) return reply.code(404).send({ error: { code: 'NOT_FOUND', message: 'Tunnel not found' } });
        return { ok: true };
    });
}
