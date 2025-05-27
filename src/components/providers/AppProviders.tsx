
"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import type { ReactNode } from 'react';
import { useState } from 'react';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  // Instantiate QueryClient inside the Client Component
  // Use useState to ensure it's only created once per component instance
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="formulateai-theme">
        {children} 
        {/* AppShell and its children will be passed as {children} here */}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
