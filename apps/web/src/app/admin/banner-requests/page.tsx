import { AdminBannerRequestsManagement } from '@/components/admin/admin-banner-requests-management';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminBannerRequestsPage() {
  return (
    <AdminShell>
      <AdminBannerRequestsManagement />
    </AdminShell>
  );
}
