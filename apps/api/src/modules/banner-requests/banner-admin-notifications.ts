import { NotificationType } from '@prisma/client';

import { sendAdminNotification } from '../notifications/send-admin-notification';

export async function notifyAdminBannerRequestPending(requestId: string) {
  await sendAdminNotification({
    type: NotificationType.ADMIN_BANNER_REQUEST,
    title: { ar: 'طلب بنر إعلاني جديد', en: 'New banner ad request' },
    body: {
      ar: 'يوجد طلب بنر إعلاني جديد بانتظار المراجعة والموافقة.',
      en: 'A new homepage banner request is waiting for review and approval.'
    },
    metadata: { requestId }
  });
}
