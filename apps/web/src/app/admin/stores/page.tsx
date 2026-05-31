import { AdminShell } from '@/components/admin/admin-shell';
import { AdminStoresManagement } from '@/components/admin/admin-stores-management';

export default function AdminStoresPage() {
  return (
    <AdminShell>
      <AdminStoresManagement />
    </AdminShell>
  );
}
