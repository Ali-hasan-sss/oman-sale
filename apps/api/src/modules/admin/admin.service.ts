import { ApiError } from '../../shared/utils/api-error';
import { adminRepository } from './admin.repository';
import type { ListAdminUsersQuery, UpdateAdminUserDto } from './admin.validation';

export class AdminService {
  statistics() {
    return adminRepository.statistics();
  }

  listUsers(query: ListAdminUsersQuery) {
    return adminRepository.listUsers(query);
  }

  async getUser(id: string) {
    const user = await adminRepository.findUserById(id);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  async updateUser(id: string, dto: UpdateAdminUserDto) {
    const user = await adminRepository.findUserById(id);
    if (!user) throw new ApiError(404, 'User not found');
    return adminRepository.updateUser(id, dto);
  }
}

export const adminService = new AdminService();
