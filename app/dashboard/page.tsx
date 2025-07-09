"use client";
import React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  SunIcon,
  MoonIcon,
  GithubIcon,
  HomeIcon,
  ShieldIcon,
} from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AuthButton } from "@/components/auth/auth-modal";
import { ApiKeyManager } from "@/components/auth/api-key-manager";
import { UsageDashboard } from "@/components/analytics/usage-dashboard";
import { useAuth } from "@/contexts/auth-context";

const DashboardPage = () => {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background">
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <AuthButton />
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === "dark" ? (
              <SunIcon className="h-4 w-4" />
            ) : (
              <MoonIcon className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="min-h-screen p-4 font-montserrat flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">
                Authentication Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-center">
                Please sign in to access your dashboard and manage your API keys.
              </p>
              <div className="flex gap-2 justify-center">
                <Button asChild variant="outline">
                  <Link href="/">
                    <HomeIcon className="h-4 w-4 mr-2" />
                    Back to Generator
                  </Link>
                </Button>
                <AuthButton />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Button variant="outline" size="icon" asChild className="h-9 w-9">
          <Link href="/" title="Back to Generator">
            <HomeIcon className="h-4 w-4" />
          </Link>
        </Button>
        {user?.role === 'ADMIN' && (
          <Button variant="outline" size="icon" asChild className="h-9 w-9">
            <Link href="/admin" title="Admin Panel">
              <ShieldIcon className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <AuthButton />
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9"
        >
          {theme === "dark" ? (
            <SunIcon className="h-4 w-4" />
          ) : (
            <MoonIcon className="h-4 w-4" />
          )}
        </Button>
        <Button variant="outline" size="icon" asChild className="h-9 w-9">
          <Link
            href="https://github.com/toxuh/rnd"
            target="_blank"
            rel="noopener noreferrer"
            title="View on GitHub"
          >
            <GithubIcon className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="min-h-screen p-4 font-montserrat">
        <div className="max-w-6xl mx-auto py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Manage your API keys and view usage analytics
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* API Key Management */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">API Key Management</h2>
              <ApiKeyManager />
            </section>

            {/* Usage Analytics */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">Usage Analytics</h2>
              <UsageDashboard />
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;
