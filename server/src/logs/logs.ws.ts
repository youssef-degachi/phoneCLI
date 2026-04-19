import { FastifyInstance, FastifyRequest } from 'fastify';
import { getProjectProcess } from '../projects/projects.service.js';
import { verifyToken } from '../auth/auth.service.js';

export async function logsWs(fastify: FastifyInstance) {
    fastify.get('/ws/logs/:projectId', { websocket: true }, (connection, req: FastifyRequest) => {
        const { projectId } = req.params as { projectId: string };
        const { socket } = connection;

        const token = req.cookies.token || (req.query as any).token;
        if (!token || !verifyToken(token)) {
            socket.send(JSON.stringify({ type: 'error', message: 'Unauthorized' }));
            socket.close();
            return;
        }

        const proc = getProjectProcess(projectId);
        if (!proc) {
            socket.send(JSON.stringify({ type: 'error', message: 'Project not running' }));
            socket.close();
            return;
        }

        const onStdout = (data: any) => {
            socket.send(JSON.stringify({ type: 'log', stream: 'stdout', data: data.toString() }));
        };

        const onStderr = (data: any) => {
            socket.send(JSON.stringify({ type: 'log', stream: 'stderr', data: data.toString() }));
        };

        proc.stdout?.on('data', onStdout);
        proc.stderr?.on('data', onStderr);

        socket.on('close', () => {
            proc.stdout?.removeListener('data', onStdout);
            proc.stderr?.removeListener('data', onStderr);
        });
    });
}
