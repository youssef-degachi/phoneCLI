"use client"

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, Play, Square, RefreshCcw, ExternalLink, Terminal } from 'lucide-react';
import Link from 'next/link';

export default function ProjectPage() {
    const { id } = useParams();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProject();
        const interval = setInterval(fetchProject, 3000);
        return () => clearInterval(interval);
    }, [id]);

    const fetchProject = async () => {
        try {
            const res = await api.get('/projects');
            const data = res.data.find((p: any) => p.id === id);
            setProject(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'start' | 'stop' | 'restart') => {
        try {
            await api.post(`/projects/${id}/${action}`);
            fetchProject();
        } catch (err) {
            alert(`Failed to ${action} project`);
        }
    };

    if (loading) return null;
    if (!project) return <div className="p-6 text-zinc-500">Project not found</div>;

    return (
        <div className="min-h-screen bg-black text-zinc-400 p-6">
            <header className="flex items-center space-x-4 mb-8">
                <button onClick={() => router.back()}>
                    <ChevronLeft className="h-6 w-6 text-zinc-500" />
                </button>
                <h1 className="text-xl font-bold text-white">{project.name}</h1>
            </header>

            <div className="space-y-6">
                <Card className="border-zinc-800 bg-zinc-900/40">
                    <CardHeader>
                        <CardTitle className="text-sm text-zinc-500 uppercase tracking-widest">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`h-3 w-3 rounded-full ${project.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className="text-lg font-bold text-white uppercase">{project.status}</span>
                            </div>
                            {project.status === 'running' && (
                                <div className="text-xs font-mono text-zinc-600">PID: {project.pid} | Port: {project.devPort}</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                    <Button
                        onClick={() => handleAction('start')}
                        disabled={project.status === 'running'}
                        className="h-16 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-30"
                    >
                        <Play className="mr-2 h-5 w-5" /> Start
                    </Button>
                    <Button
                        onClick={() => handleAction('stop')}
                        disabled={project.status !== 'running'}
                        className="h-16 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30"
                    >
                        <Square className="mr-2 h-5 w-5" /> Stop
                    </Button>
                </div>

                <Button
                    onClick={() => handleAction('restart')}
                    variant="outline"
                    className="w-full h-12 border-zinc-800 text-zinc-400"
                >
                    <RefreshCcw className="mr-2 h-4 w-4" /> Restart Server
                </Button>

                <section className="space-y-4 pt-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-600">Actions</h2>
                    <div className="grid gap-3">
                        <Link href={`/proxy/${id}`} target="_blank">
                            <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                                <div className="flex items-center space-x-3 text-white">
                                    <ExternalLink className="h-5 w-5 text-indigo-500" />
                                    <span className="text-sm font-medium">Open Web UI</span>
                                </div>
                                <ChevronLeft className="h-4 w-4 rotate-180 text-zinc-700" />
                            </div>
                        </Link>
                        <Link href={`/terminal`}>
                            <div className="flex items-center justify-between p-4 rounded-xl border border-zinc-800 bg-zinc-950">
                                <div className="flex items-center space-x-3 text-white">
                                    <Terminal className="h-5 w-5 text-indigo-500" />
                                    <span className="text-sm font-medium">Project Terminal</span>
                                </div>
                                <ChevronLeft className="h-4 w-4 rotate-180 text-zinc-700" />
                            </div>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
