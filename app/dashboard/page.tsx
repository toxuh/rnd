"use client";
import React from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ApiKeyManager } from "@/components/auth/api-key-manager";
import { UsageDashboard } from "@/components/analytics/usage-dashboard";

const DashboardPage = () => {
  return (
    <DashboardLayout 
      title="Dashboard Overview" 
      description="Manage your API keys and view usage analytics"
    >
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
    </DashboardLayout>
  );
};

export default DashboardPage;
