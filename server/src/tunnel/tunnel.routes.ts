import { FastifyInstance } from 'fastify';
import { getTunnelStatus, startTunnel, stopTunnel } from './tunnel.manager.js';

export async function tunnelRoutes(fastify: FastifyInstance) {
    fastify.get('/status', async () => {
        return getTunnelStatus();
    });

    fastify.post('/restart', async () => {
        stopTunnel();
        startTunnel();
        return { ok: true };
    });
}
