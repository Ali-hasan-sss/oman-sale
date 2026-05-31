import { AdminReportsManagement } from '@/components/admin/admin-reports-management';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminReportsPage() {
  return (
    <AdminShell>
      <AdminReportsManagement />
    </AdminShell>
  );
}
