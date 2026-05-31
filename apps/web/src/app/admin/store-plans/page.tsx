import { AdminStorePlansManagement } from '@/components/admin/admin-store-plans-management';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminStorePlansPage() {
  return (
    <AdminShell>
      <AdminStorePlansManagement />
    </AdminShell>
  );
}
