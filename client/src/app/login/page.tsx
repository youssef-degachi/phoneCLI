"use client"

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock } from 'lucide-react';

export default function LoginPage() {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleLogin = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setError('');
        try {
            await login(pin);
        } catch (err) {
            setError('Invalid PIN');
            setPin('');
        }
    };

    const addDigit = (digit: string) => {
        if (pin.length < 8) setPin(pin + digit);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-black p-6">
            <div className="w-full max-w-sm space-y-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600">
                    <Lock className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Rove Secure Access</h1>

                <div className="space-y-4">
                    <div className="flex justify-center space-x-2">
                        {[...Array(Math.max(pin.length, 4))].map((_, i) => (
                            <div
                                key={i}
                                className={`h-4 w-4 rounded-full border-2 border-indigo-500 ${i < pin.length ? 'bg-indigo-500' : 'bg-transparent'}`}
                            />
                        ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 p-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'C', 0, 'OK'].map((key) => (
                            <button
                                key={key}
                                onClick={() => {
                                    if (key === 'C') setPin('');
                                    else if (key === 'OK') handleLogin();
                                    else addDigit(key.toString());
                                }}
                                className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900 text-2xl font-semibold text-white active:bg-zinc-800"
                            >
                                {key}
                            </button>
                        ))}
                    </div>

                    {error && <p className="text-sm font-medium text-red-500">{error}</p>}
                </div>
            </div>
        </div>
    );
}
