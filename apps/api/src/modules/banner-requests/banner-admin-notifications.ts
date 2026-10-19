import { NotificationType } from '@prisma/client';

import { bannerPlacementLabels, DEFAULT_BANNER_PLACEMENT } from '../banners/banner-placements';
import { sendAdminNotification } from '../notifications/send-admin-notification';
import { bannerRequestsRepository } from './banner-requests.repository';

export async function notifyAdminBannerRequestPending(requestId: string) {
  const request = await bannerRequestsRepository.findById(requestId);
  const placement = request?.placement ?? DEFAULT_BANNER_PLACEMENT;
  const label = bannerPlacementLabels[placement];

  await sendAdminNotification({
    type: NotificationType.ADMIN_BANNER_REQUEST,
    title: { ar: 'طلب بنر إعلاني جديد', en: 'New banner ad request' },
    body: {
      ar: `طلب إعلان جديد للبنر «${label.ar}» بانتظار المراجعة والموافقة.`,
      en: `A new ad request for “${label.en}” is waiting for review and approval.`
    },
    metadata: { requestId, placement }
  });
}
