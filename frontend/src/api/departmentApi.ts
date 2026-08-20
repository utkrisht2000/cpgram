import { apiRequest } from './client';

export interface DepartmentItem {
  id: string;
  code: string;
  name_en: string;
  name_hi: string;
  description_en: string;
  description_hi: string;
  sla_days: number;
}

export const departmentApi = {
  getAll(): Promise<{ departments: DepartmentItem[] }> {
    return apiRequest('/departments');
  },

  getById(id: string): Promise<{ department: DepartmentItem }> {
    return apiRequest(`/departments/${id}`);
  },
};
