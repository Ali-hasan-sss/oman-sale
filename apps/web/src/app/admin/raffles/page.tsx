import { AdminRafflesManagement } from '@/components/admin/admin-raffles-management';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminRafflesPage() {
  return (
    <AdminShell>
      <AdminRafflesManagement />
    </AdminShell>
  );
}
