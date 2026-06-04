import { AdminStoreTypesManagement } from '@/components/admin/admin-store-types-management';
import { AdminShell } from '@/components/admin/admin-shell';
import { AdminStoresManagement } from '@/components/admin/admin-stores-management';

export default function AdminStoresPage() {
  return (
    <AdminShell>
      <div className="space-y-8">
        <AdminStoresManagement />
        <AdminStoreTypesManagement />
      </div>
    </AdminShell>
  );
}
