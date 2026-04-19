import { FastifyInstance } from 'fastify';
import { getSystemStats } from './system.service.js';

export async function systemRoutes(fastify: FastifyInstance) {
    fastify.get('/stats', async () => {
        return await getSystemStats();
    });
}
