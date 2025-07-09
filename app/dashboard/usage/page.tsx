"use client";
import React from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { UsageDashboard } from "@/components/analytics/usage-dashboard";

const UsagePage = () => {
  return (
    <DashboardLayout 
      title="Usage Analytics" 
      description="View detailed analytics and usage statistics for your API keys"
    >
      <UsageDashboard />
    </DashboardLayout>
  );
};

export default UsagePage;
