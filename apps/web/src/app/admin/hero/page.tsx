import { AdminHeroBannersManagement } from '@/components/admin/admin-hero-banners-management';
import { AdminHeroManagement } from '@/components/admin/admin-hero-management';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminHeroPage() {
  return (
    <AdminShell>
      <div className="space-y-8">
        <AdminHeroManagement />
        <AdminHeroBannersManagement />
      </div>
    </AdminShell>
  );
}
