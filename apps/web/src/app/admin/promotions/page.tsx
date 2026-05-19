import { AdminPromotionsManagement } from '@/components/admin/admin-promotions-management';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminPromotionsPage() {
  return (
    <AdminShell>
      <AdminPromotionsManagement />
    </AdminShell>
  );
}
