"use client";
import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Shield,
  Home,
  SunIcon,
  MoonIcon,
  LogOut,
  BarChart3,
  Users,
  Key,
  AlertTriangle
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const adminNavigationItems = [
  {
    name: 'Admin Overview',
    href: '/admin',
    icon: BarChart3,
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: 'Security Dashboard',
    href: '/admin/security',
    icon: AlertTriangle,
  },
  {
    name: 'System Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
];

const userNavigationItems = [
  {
    name: 'User Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
];

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const isActiveRoute = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-4">Please sign in to access the admin panel.</p>
          <Button onClick={() => router.push('/')}>
            <Home className="h-4 w-4 mr-2" />
            Back to Generator
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">You don't have permission to access the admin panel.</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => router.push('/')}>
              <Home className="h-4 w-4 mr-2" />
              Back to Generator
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <BarChart3 className="h-4 w-4 mr-2" />
              User Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r min-h-screen relative">
          <div className="p-6">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Shield className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Admin Panel</h2>
            </Link>
          </div>
          
          <nav className="px-4 space-y-1">
            {adminNavigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActiveRoute(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            
            <div className="border-t my-4" />
            
            {userNavigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActiveRoute(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* User info and sign out at bottom */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center space-x-3 p-3 bg-accent rounded-md mb-2">
              <User className="h-4 w-4" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {user?.role}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="flex-1 justify-start"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top bar */}
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-14 items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/">
                    <Home className="h-4 w-4 mr-2" />
                    Back to Generator
                  </Link>
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-8 w-8"
                >
                  {theme === "dark" ? (
                    <SunIcon className="h-4 w-4" />
                  ) : (
                    <MoonIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="p-6">
            {title && (
              <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                  <Shield className="h-8 w-8" />
                  {title}
                </h1>
                {description && (
                  <p className="text-muted-foreground mt-2">{description}</p>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
