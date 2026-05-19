import { AdminShell } from '@/components/admin/admin-shell';
import { AdminTourismManagement } from '@/components/admin/admin-tourism-management';

export default function AdminTourismPage() {
  return (
    <AdminShell>
      <AdminTourismManagement />
    </AdminShell>
  );
}
