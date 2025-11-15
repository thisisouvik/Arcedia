'use client';

import { ThirdwebProvider } from 'thirdweb/react';
import { sepolia } from 'thirdweb/chains';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThirdwebProvider>
            <AuthProvider>
                {children}
            </AuthProvider>
        </ThirdwebProvider>
    );
}
