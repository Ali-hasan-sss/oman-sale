import { AdminShell } from '@/components/admin/admin-shell';
import { AdminArticlesManagement } from '@/components/admin/admin-articles-management';

export default function AdminArticlesPage() {
  return (
    <AdminShell>
      <AdminArticlesManagement />
    </AdminShell>
  );
}
