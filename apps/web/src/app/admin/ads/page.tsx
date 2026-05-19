import { AdminAdsManagement } from '@/components/admin/admin-ads-management';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminAdsPage() {
  return (
    <AdminShell>
      <AdminAdsManagement />
    </AdminShell>
  );
}
