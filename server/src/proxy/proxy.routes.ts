import { FastifyInstance } from 'fastify';
import proxy from '@fastify/http-proxy';
import { config } from '../config.js';

export async function proxyRoutes(fastify: FastifyInstance) {
    config.projects.forEach((project) => {
        fastify.register(proxy, {
            upstream: `http://localhost:${project.devPort}`,
            prefix: `/proxy/${project.id}`,
            rewritePrefix: '/',
            http2: false,
        });
    });
}
