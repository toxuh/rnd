/**
 * Dashboard Layout Component
 * Layout for authenticated user dashboard pages
 */

import { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/auth-context';
import { Button } from '../../components/ui/button';
import { 
  User, 
  Key, 
  BarChart3, 
  Settings, 
  LogOut,
  Shield
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    name: 'API Keys',
    href: '/dashboard/api-keys',
    icon: Key,
  },
  {
    name: 'Usage',
    href: '/dashboard/usage',
    icon: BarChart3,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
];

const adminNavigationItems = [
  {
    name: 'Admin Panel',
    href: '/admin',
    icon: Shield,
  },
];

export function DashboardLayout({ children, title, description }: DashboardLayoutProps) {
  const { user, signOut } = useAuth();

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-card border-r">
          <div className="p-6">
            <h2 className="text-lg font-semibold">RND Dashboard</h2>
          </div>
          
          <nav className="px-4 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            ))}
            
            {isAdmin && (
              <>
                <div className="border-t my-4" />
                {adminNavigationItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </>
            )}
          </nav>

          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center space-x-3 p-3 bg-accent rounded-md">
              <User className="h-4 w-4" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.role}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full mt-2 justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="p-8">
            {title && (
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
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
