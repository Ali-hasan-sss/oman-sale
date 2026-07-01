import { AdminLegalManagement } from '@/components/admin/admin-legal-management';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminLegalPage() {
  return (
    <AdminShell>
      <AdminLegalManagement />
    </AdminShell>
  );
}
