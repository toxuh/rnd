"use client";
import { UsageDashboard } from "@/components/analytics/usage-dashboard";
import { AdminLayout } from "@/components/layouts/admin-layout";

const AnalyticsPage = () => (
  <AdminLayout
    title="System Analytics"
    description="Comprehensive system-wide usage analytics and performance metrics"
  >
    <UsageDashboard />
  </AdminLayout>
);

export default AnalyticsPage;
