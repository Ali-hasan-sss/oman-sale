import { UserRole } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { resolveUserMedia } from '../../shared/utils/resolve-entity-media';
import { notificationsService } from '../notifications/notifications.service';
import { adminRepository } from './admin.repository';
import type { ListAdminReportsQuery, ListAdminUsersQuery, UpdateAdminUserDto } from './admin.validation';

export class AdminService {
  statistics() {
    return adminRepository.statistics();
  }

  async listUsers(query: ListAdminUsersQuery) {
    const result = await adminRepository.listUsers(query);
    return {
      ...result,
      items: result.items.map(resolveUserMedia)
    };
  }

  listReports(query: ListAdminReportsQuery) {
    return adminRepository.listReports(query);
  }

  async getUser(id: string) {
    const user = await adminRepository.findUserById(id);
    if (!user) throw new ApiError(404, 'User not found');
    return resolveUserMedia(user);
  }

  async updateUser(id: string, dto: UpdateAdminUserDto) {
    const user = await adminRepository.findUserById(id);
    if (!user) throw new ApiError(404, 'User not found');

    if (dto.isBlocked === true) {
      const bannedUser = await adminRepository.banUserCompletely(id);
      await notificationsService.sendAccountBlockedNotification(id).catch(() => undefined);
      return bannedUser;
    }

    return adminRepository.updateUser(id, dto);
  }

  async dismissReport(id: string) {
    const report = await adminRepository.findReportById(id);
    if (!report) throw new ApiError(404, 'Report not found');
    return adminRepository.softDeleteReport(id);
  }

  async banUserFromReport(reportId: string) {
    const report = await adminRepository.findReportById(reportId);
    if (!report) throw new ApiError(404, 'Report not found');

    const seller = report.ad.user;
    if (!seller) throw new ApiError(404, 'Reported user not found');
    if (seller.role === UserRole.ADMIN || seller.role === UserRole.MODERATOR) {
      throw new ApiError(400, 'Cannot ban admin or moderator accounts from a report');
    }

    const bannedUser = await adminRepository.banUserCompletely(seller.id);
    await notificationsService.sendAccountBlockedNotification(seller.id).catch(() => undefined);
    return { user: bannedUser, reportId };
  }
}

export const adminService = new AdminService();
