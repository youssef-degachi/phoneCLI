"use client"

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, LogOut, Shield, Wifi, Terminal, Info } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
    const { logout } = useAuth();
    const [version] = useState('1.0.0');

    return (
        <div className="min-h-screen bg-black text-zinc-400 p-6">
            <header className="flex items-center space-x-4 mb-8">
                <Link href="/dashboard">
                    <ChevronLeft className="h-6 w-6 text-zinc-500" />
                </Link>
                <h1 className="text-xl font-bold text-white">Settings</h1>
            </header>

            <div className="space-y-6 pb-24">
                <section className="space-y-3">
                    <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-600 px-1">Infrastructure</h2>
                    <Card className="border-zinc-800 bg-zinc-900/40">
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-800">
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center space-x-3">
                                        <Wifi className="h-5 w-5 text-indigo-500" />
                                        <span className="text-sm text-white">Cloudflare Tunnel</span>
                                    </div>
                                    <span className="text-[10px] text-green-500 font-bold uppercase">Active</span>
                                </div>
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center space-x-3">
                                        <Shield className="h-5 w-5 text-indigo-500" />
                                        <span className="text-sm text-white">Auth Session</span>
                                    </div>
                                    <span className="text-[10px] text-zinc-500 font-medium">Valid (7d)</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-3">
                    <h2 className="text-[10px] uppercase font-bold tracking-[0.2em] text-zinc-600 px-1">Application</h2>
                    <Card className="border-zinc-800 bg-zinc-900/40">
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-800">
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center space-x-3 text-white">
                                        <Info className="h-5 w-5 text-zinc-500" />
                                        <span className="text-sm">Version</span>
                                    </div>
                                    <span className="text-xs font-mono">{version}</span>
                                </div>
                                <button onClick={() => logout()} className="w-full flex items-center space-x-3 p-4 text-red-500">
                                    <LogOut className="h-5 w-5" />
                                    <span className="text-sm font-semibold">Sign Out</span>
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </section>

                <div className="text-center py-8">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-700">Rove Remote Dev Center</p>
                    <p className="text-[9px] text-zinc-800 mt-1">Self-hosted & Private</p>
                </div>
            </div>
        </div>
    );
}
