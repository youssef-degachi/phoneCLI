import { FastifyInstance } from 'fastify';
import { getFileTree, readFileContent } from './files.service.js';

export async function fileRoutes(fastify: FastifyInstance) {
    fastify.get('/tree', async (request, reply) => {
        const { path: dirPath } = request.query as { path: string };
        if (!dirPath) return reply.code(400).send({ error: 'path is required' });

        try {
            return { tree: getFileTree(dirPath) };
        } catch (err) {
            return reply.code(403).send({ error: 'Access denied' });
        }
    });

    fastify.get('/read', async (request, reply) => {
        const { path: filePath } = request.query as { path: string };
        if (!filePath) return reply.code(400).send({ error: 'path is required' });

        try {
            return readFileContent(filePath);
        } catch (err) {
            return reply.code(403).send({ error: 'Access denied' });
        }
    });
}
