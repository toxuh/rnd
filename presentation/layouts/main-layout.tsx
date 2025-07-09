/**
 * Main Layout Component
 * Primary layout wrapper for the application
 */

import { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../../contexts/auth-context';

interface MainLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function MainLayout({ children, title, description }: MainLayoutProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <AuthProvider>
          <div className="min-h-screen bg-background">
            <main className="container mx-auto px-4 py-8">
              {title && (
                <div className="mb-8">
                  <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                  {description && (
                    <p className="text-muted-foreground mt-2">{description}</p>
                  )}
                </div>
              )}
              {children}
            </main>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
