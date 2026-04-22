import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import replyFrom from '@fastify/reply-from';
import { env } from './config.js';
import { authRoutes } from './auth/auth.routes.js';
import { verifyToken } from './auth/auth.service.js';
import { terminalWs } from './terminal/terminal.ws.js';
import websocket from '@fastify/websocket';
import { tunnelRoutes } from './tunnel/tunnel.routes.js';
import { startTunnel } from './tunnel/tunnel.manager.js';
import { projectRoutes } from './projects/projects.routes.js';
import { logsWs } from './logs/logs.ws.js';
import { fileRoutes } from './files/files.routes.js';
import { aiWs } from './ai/ai.ws.js';
import { proxyRoutes } from './proxy/proxy.routes.js';
import { systemRoutes } from './system/system.routes.js';
import { screenRoutes } from './system/screen.routes.js';

const fastify = Fastify({
    logger: {
        transport: env.NODE_ENV === 'development' ? {
            target: 'pino-pretty',
            options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        } : undefined,
    },
});

// Plugins
fastify.register(helmet, { contentSecurityPolicy: false });
fastify.register(cors, {
    origin: true,
    credentials: true,
    preflightContinue: false,
    strictPreflight: false,
});
fastify.register(cookie);
fastify.register(websocket);

// reply-from for UI proxy
fastify.register(replyFrom, { base: 'http://localhost:3000' });

// JWT Middleware — only protect /api/* routes
fastify.addHook('preHandler', async (request, reply) => {
    const url = request.url;
    if (!url.startsWith('/api/')) return;

    const publicApiRoutes = ['/api/auth/login', '/api/auth/verify'];
    if (publicApiRoutes.some(r => url.startsWith(r))) return;

    const token = request.cookies.token || request.headers.authorization?.replace('Bearer ', '');
    if (!token || !verifyToken(token)) {
        return reply.code(401).send({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
    }
});

// API + WebSocket routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(terminalWs);
fastify.register(tunnelRoutes, { prefix: '/api/tunnel' });
fastify.register(projectRoutes, { prefix: '/api/projects' });
fastify.register(logsWs);
fastify.register(fileRoutes, { prefix: '/api/files' });
fastify.register(aiWs);
fastify.register(proxyRoutes);
fastify.register(systemRoutes, { prefix: '/api/system' });
fastify.register(screenRoutes, { prefix: '/api/system/screen' });

// Health check
fastify.get('/health', async () => ({
    ok: true, version: '1.0.0', timestamp: new Date().toISOString()
}));

// Catch-all: forward everything else to Next.js client on port 3000
const uiHandler = async (request: any, reply: any) => {
    return reply.from(request.url);
};
fastify.get('/*', uiHandler);
fastify.post('/*', uiHandler);
fastify.put('/*', uiHandler);
fastify.delete('/*', uiHandler);
fastify.head('/*', uiHandler);
fastify.patch('/*', uiHandler);

// Start server
const start = async () => {
    try {
        await fastify.listen({ port: env.PORT, host: env.HOST });
        fastify.log.info(`🚀 Rove server listening on ${env.HOST}:${env.PORT}`);
        startTunnel();
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
