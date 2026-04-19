import { FastifyInstance } from 'fastify';
import { getProjectsStatus, startProject, stopProject } from './projects.service.js';

export async function projectRoutes(fastify: FastifyInstance) {
    fastify.get('/', async () => {
        return getProjectsStatus();
    });

    fastify.post('/:id/start', async (request, reply) => {
        const { id } = request.params as { id: string };
        startProject(id);
        return { ok: true };
    });

    fastify.post('/:id/stop', async (request, reply) => {
        const { id } = request.params as { id: string };
        stopProject(id);
        return { ok: true };
    });

    fastify.post('/:id/restart', async (request, reply) => {
        const { id } = request.params as { id: string };
        stopProject(id);
        startProject(id);
        return { ok: true };
    });
}
