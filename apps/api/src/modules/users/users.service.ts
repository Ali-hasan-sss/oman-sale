import { Prisma } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { hashPassword, verifyPassword } from '../../shared/utils/password';
import { usersRepository } from './users.repository';
import type { ChangePasswordDto, UpdateProfileDto } from './users.validation';

export class UsersService {
  async me(userId: string) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');
    return user;
  }

  list() {
    return usersRepository.list();
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await usersRepository.findById(userId);
    if (!user) throw new ApiError(404, 'User not found');

    try {
      return await usersRepository.updateProfile(userId, dto);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiError(409, 'Phone number is already used');
      }

      throw error;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await usersRepository.findByIdWithPassword(userId);
    if (!user) throw new ApiError(404, 'User not found');

    const isCurrentPasswordValid = await verifyPassword(dto.currentPassword, user.password);
    if (!isCurrentPasswordValid) throw new ApiError(400, 'Current password is incorrect');

    const password = await hashPassword(dto.newPassword);
    await usersRepository.updatePassword(userId, password);
    return { changed: true };
  }
}

export const usersService = new UsersService();
