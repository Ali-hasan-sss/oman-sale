import { AdminShell } from '@/components/admin/admin-shell';
import { AdminStorePlanPricingPage } from '@/components/admin/admin-store-plan-pricing-page';

export default function AdminStorePlanPricingRoutePage({ params }: { params: { id: string } }) {
  return (
    <AdminShell>
      <AdminStorePlanPricingPage planId={params.id} />
    </AdminShell>
  );
}
