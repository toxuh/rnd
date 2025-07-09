"use client";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { SecurityDashboard } from "@/components/security/security-dashboard";

const SecurityPage = () => (
  <AdminLayout
    title="Security Dashboard"
    description="Monitor security events, threats, and system protection status"
  >
    <SecurityDashboard />
  </AdminLayout>
);

export default SecurityPage;
