"use client";
import { UsageDashboard } from "@/components/analytics/usage-dashboard";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { SecurityDashboard } from "@/components/security/security-dashboard";

const AdminPage = () => {
  return (
    <AdminLayout
      title="Admin Overview"
      description="System-wide analytics, security monitoring, and user management"
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">
            System Usage Analytics
          </h2>
          <UsageDashboard />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Security Dashboard</h2>
          <SecurityDashboard />
        </section>
      </div>
    </AdminLayout>
  );
};

export default AdminPage;
