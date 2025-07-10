"use client";
import React from "react";
import { SEOHead } from "@/components/seo/seo-head";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ApiKeyManager } from "@/components/auth/api-key-manager";
import { UsageDashboard } from "@/components/analytics/usage-dashboard";

const DashboardPage = () => {
  return (
    <>
      <SEOHead
        title="User Dashboard | True Random Generator"
        description="Manage your API keys, monitor usage analytics, and configure settings for the True Random Generator service."
        canonical="/dashboard"
        noIndex={true}
      />

      <DashboardLayout
        title="Dashboard Overview"
        description="Manage your API keys and view usage analytics"
      >
        <div className="space-y-8">
          {/* API Key Management */}
          <section role="region" aria-labelledby="api-keys-heading">
            <h2 id="api-keys-heading" className="text-2xl font-semibold mb-4">API Key Management</h2>
            <ApiKeyManager />
          </section>

          {/* Usage Analytics */}
          <section role="region" aria-labelledby="analytics-heading">
            <h2 id="analytics-heading" className="text-2xl font-semibold mb-4">Usage Analytics</h2>
            <UsageDashboard />
          </section>
        </div>
      </DashboardLayout>
    </>
  );
};

export default DashboardPage;
