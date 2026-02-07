import { apiClient } from './client';
import { Invoice, CreateInvoiceDto, AddInvoiceItemDto, QueryInvoicesDto } from '@/types';

export const invoicesApi = {
  getAll: async (params?: QueryInvoicesDto): Promise<Invoice[]> => {
    const response = await apiClient.get<Invoice[]>('/invoices', { params });
    return response.data;
  },

  getById: async (id: number): Promise<Invoice> => {
    const response = await apiClient.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  create: async (data: CreateInvoiceDto): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>('/invoices', data);
    return response.data;
  },

  addItems: async (id: number, data: AddInvoiceItemDto): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>(`/invoices/${id}/items`, data);
    return response.data;
  },

  pay: async (id: number): Promise<Invoice> => {
    const response = await apiClient.post<Invoice>(`/invoices/${id}/pay`);
    return response.data;
  },

  cancel: async (id: number): Promise<Invoice> => {
    const response = await apiClient.delete<Invoice>(`/invoices/${id}`);
    return response.data;
  },
};
