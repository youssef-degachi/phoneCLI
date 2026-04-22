import { FastifyInstance } from 'fastify';
import { screenService } from './screen.service.js';
import { spawn } from 'child_process';

export async function screenRoutes(fastify: FastifyInstance) {
    // Polling endpoint
    fastify.get('/info', async () => {
        return {
            os: process.platform,
            session: process.env.XDG_SESSION_TYPE || 'unknown',
            isWayland: process.env.XDG_SESSION_TYPE === 'wayland'
        };
    });

    fastify.get('/capture', async (request, reply) => {
        const { monitor } = request.query as { monitor?: string };
        const data = await screenService.captureMonitor(Number(monitor) || 0);
        reply.type('image/jpeg').send(data);
    });

    // Window list for App Switcher
    fastify.get('/windows', async () => {
        return await screenService.getOpenWindows();
    });

    // Interaction endpoint
    fastify.post('/interact', async (request, reply) => {
        const event = request.body as any;
        await screenService.interact(event);
        return { ok: true };
    });

    // Focus window
    fastify.post('/focus', async (request, reply) => {
        const { windowId } = request.body as { windowId: string };
        await screenService.focusWindow(windowId);
        return { ok: true };
    });

    // Live Streaming WebSocket
    fastify.get('/live', { websocket: true }, (connection, req) => {
        const { socket } = connection;
        const { monitor, fps, quality } = req.query as { monitor?: string, fps?: string, quality?: string };

        const monitorIdx = Number(monitor) || 0;
        const monitorFps = Number(fps) || 10;
        const offsetX = monitorIdx * 2240;

        // Use ffmpeg to stream JPEGs
        // Scale to 960 width for mobile performance
        const ffmpeg = spawn('ffmpeg', [
            '-f', 'x11grab',
            '-video_size', '2240x1080',
            '-offset_x', offsetX.toString(),
            '-offset_y', '0',
            '-framerate', monitorFps.toString(),
            '-i', ':0.0',
            '-vf', 'scale=960:-1',
            '-vcodec', 'mjpeg',
            '-q:v', (quality || '5'),
            '-f', 'image2pipe',
            'pipe:1'
        ]);

        let buffer = Buffer.alloc(0);

        ffmpeg.stdout.on('data', (data) => {
            buffer = Buffer.concat([buffer, data]);

            // JPEG images start with 0xFFD8 and end with 0xFFD9
            let start = buffer.indexOf(Buffer.from([0xFF, 0xD8]));
            let end = buffer.indexOf(Buffer.from([0xFF, 0xD9]));

            while (start !== -1 && end !== -1 && end > start) {
                const frame = buffer.slice(start, end + 2);
                socket.send(frame);
                buffer = buffer.slice(end + 2);
                start = buffer.indexOf(Buffer.from([0xFF, 0xD8]));
                end = buffer.indexOf(Buffer.from([0xFF, 0xD9]));
            }
        });

        socket.on('close', () => {
            ffmpeg.kill();
        });

        socket.on('error', () => {
            ffmpeg.kill();
        });
    });
}
