/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import type { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: (mobileNumber: string, password: string) =>
    api.post('/login', { mobileNumber, password }),
};

export const menuService = {
  fetchMenu: () => api.get('/fetchmenu'),
  addToMenu: (item: { name: string; price: number; description?: string }) =>
    api.post('/addToMenu', item),
  updateMenuItem: (id: string, item: { name: string; price: number; description?: string }) =>
    api.put(`/updateMenuItem/${id}`, item),
  deleteMenuItem: (id: string) =>
    api.delete(`/deleteMenuItem/${id}`),
};

export const salesService = {
  addToSales: (order: { customerName: string; items: any[]; totalAmount: number }) =>
    api.post('/addToSales', order),
  getSalesHistory: (filters?: any) =>
    api.get('/getSalesHistory', { params: filters }),
};

export const offerService = {
  createOffer: (offer: {
    title: string;
    description?: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    minOrderAmount?: number;
    startDate: string;
    endDate: string;
    itemIds?: string[];
    maxUsage?: number;
  }) => api.post('/createOffer', offer),
  getOffers: () => api.get('/getOffers'),
  getAllOffers: () => api.get('/getAllOffers'),
  updateOffer: (id: string, offer: any) =>
    api.put(`/updateOffer/${id}`, offer),
  deleteOffer: (id: string) =>
    api.delete(`/deleteOffer/${id}`),
};

export default api;
