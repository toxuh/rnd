"use client";
import React from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { ApiKeyManager } from "@/components/auth/api-key-manager";

const ApiKeysPage = () => {
  return (
    <DashboardLayout 
      title="API Keys" 
      description="Create and manage your API keys for accessing the RND service"
    >
      <ApiKeyManager />
    </DashboardLayout>
  );
};

export default ApiKeysPage;
