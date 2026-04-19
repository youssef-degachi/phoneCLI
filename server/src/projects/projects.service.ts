import { spawn, ChildProcess } from 'child_process';
import { config } from '../config.js';

export interface ProjectStatus {
    id: string;
    name: string;
    status: 'stopped' | 'starting' | 'running' | 'error';
    port: number;
    pid?: number;
    uptime?: number;
}

const processes = new Map<string, ChildProcess>();
const startTimes = new Map<string, number>();

export const getProjectsStatus = (): ProjectStatus[] => {
    return config.projects.map((p) => {
        const proc = processes.get(p.id);
        const startTime = startTimes.get(p.id);

        return {
            id: p.id,
            name: p.name,
            status: proc ? 'running' : 'stopped',
            port: p.devPort,
            pid: proc?.pid,
            uptime: startTime ? Date.now() - startTime : undefined,
        };
    });
};

export const startProject = (id: string) => {
    const project = config.projects.find((p) => p.id === id);
    if (!project || processes.has(id)) return;

    const [cmd, ...args] = project.devCommand.split(' ');
    const proc = spawn(cmd, args, {
        cwd: project.path,
        shell: true,
        env: { ...process.env, PORT: project.devPort.toString() },
    });

    processes.set(id, proc);
    startTimes.set(id, Date.now());

    proc.on('exit', () => {
        processes.delete(id);
        startTimes.delete(id);
    });

    return proc;
};

export const stopProject = (id: string) => {
    const proc = processes.get(id);
    if (proc) {
        proc.kill();
        processes.delete(id);
        startTimes.delete(id);
    }
};

export const getProjectProcess = (id: string) => processes.get(id);
