import { AdminShell } from '@/components/admin/admin-shell';
import { AdminUserDetails } from '@/components/admin/admin-user-details';

export default function AdminUserDetailsPage({ params }: { params: { id: string } }) {
  return (
    <AdminShell>
      <AdminUserDetails userId={params.id} />
    </AdminShell>
  );
}
