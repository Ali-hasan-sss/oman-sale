import { AdminContentLoader } from '@/components/admin/admin-page-loader';
import { AdminShell } from '@/components/admin/admin-shell';

export default function LocalizedAdminLoading() {
  return (
    <AdminShell contentLoading>
      <AdminContentLoader />
    </AdminShell>
  );
}
