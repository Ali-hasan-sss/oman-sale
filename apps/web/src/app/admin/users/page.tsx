import { AdminShell } from '@/components/admin/admin-shell';
import { AdminUsersManagement } from '@/components/admin/admin-users-management';

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <AdminUsersManagement />
    </AdminShell>
  );
}
