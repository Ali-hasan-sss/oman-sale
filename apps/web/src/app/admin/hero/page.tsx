import { AdminBannerRequestsManagement } from '@/components/admin/admin-banner-requests-management';
import { AdminHeroBannersManagement } from '@/components/admin/admin-hero-banners-management';
import { AdminHeroManagement } from '@/components/admin/admin-hero-management';
import { AdminHeaderButtonsManagement } from '@/components/admin/admin-header-buttons-management';
import { AdminShell } from '@/components/admin/admin-shell';

export default function AdminHeroPage() {
  return (
    <AdminShell>
      <div className="space-y-8">
        <AdminHeaderButtonsManagement />
        <AdminHeroManagement />
        <AdminHeroBannersManagement />
        <AdminBannerRequestsManagement />
      </div>
    </AdminShell>
  );
}
