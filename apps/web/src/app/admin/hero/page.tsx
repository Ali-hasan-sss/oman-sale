import { AdminHeroPage } from '@/components/admin/admin-hero-page';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminHeroRoutePage() {
  return (
    <AdminShell>
      <AdminHeroPage />
    </AdminShell>
  );
}
