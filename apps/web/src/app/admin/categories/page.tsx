import { AdminCategoriesManagement } from '@/components/admin/admin-categories-management';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminCategoriesPage() {
  return (
    <AdminShell>
      <AdminCategoriesManagement />
    </AdminShell>
  );
}
