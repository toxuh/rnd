"use client";
import { SEOHead } from "@/components/seo/seo-head";
import { UsageDashboard } from "@/components/analytics/usage-dashboard";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { SecurityDashboard } from "@/components/security/security-dashboard";

const AdminPage = () => {
  return (
    <>
      <SEOHead
        title="Admin Dashboard | True Random Generator"
        description="System administration dashboard for monitoring usage analytics, security events, and user management."
        canonical="/admin"
        noIndex={true}
      />

      <AdminLayout
        title="Admin Overview"
        description="System-wide analytics, security monitoring, and user management"
      >
        <div className="space-y-8">
          <section role="region" aria-labelledby="system-analytics-heading">
            <h2 id="system-analytics-heading" className="text-2xl font-semibold mb-4">
              System Usage Analytics
            </h2>
            <UsageDashboard />
          </section>

          <section role="region" aria-labelledby="security-dashboard-heading">
            <h2 id="security-dashboard-heading" className="text-2xl font-semibold mb-4">Security Dashboard</h2>
            <SecurityDashboard />
          </section>
        </div>
      </AdminLayout>
    </>
  );
};

export default AdminPage;
