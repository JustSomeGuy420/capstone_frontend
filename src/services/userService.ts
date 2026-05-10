import { api } from '../lib/api';

export type MeResponse = {
  user_id: number;
  f_name: string;
  l_name: string;
  email: string;
  account_type: string;
  created_at: string;
  candidate_id?: number;
  employer_id?: number;
  company_name?: string;
};

export type UserUpdate = {
  f_name?: string;
  l_name?: string;
  email?: string;
  password?: string;
  company_name?: string;
};

export const userService = {
  getMe: () => api.get<MeResponse>('/users/me'),
  updateUser: (userId: number, data: UserUpdate) => api.put<MeResponse>(`/users/${userId}`, data),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/users/me/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    }),
  deleteUser: (userId: number) => api.delete<{ message: string }>(`/users/${userId}`),
};
