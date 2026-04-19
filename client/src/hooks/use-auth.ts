import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';

export function useAuth() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const router = useRouter();

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            await api.get('/auth/verify');
            setIsAuthenticated(true);
        } catch (error) {
            setIsAuthenticated(false);
        }
    };

    const login = async (pin: string) => {
        try {
            await api.post('/auth/login', { pin });
            setIsAuthenticated(true);
            router.push('/dashboard');
        } catch (error) {
            throw new Error('Invalid PIN');
        }
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setIsAuthenticated(false);
        router.push('/login');
    };

    return { isAuthenticated, login, logout, checkAuth };
}
