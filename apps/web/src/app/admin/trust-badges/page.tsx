import { AdminTrustBadgesManagement } from '@/components/admin/admin-trust-badges-management';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminTrustBadgesPage() {
  return (
    <AdminShell>
      <AdminTrustBadgesManagement />
    </AdminShell>
  );
}
