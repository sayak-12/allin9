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
  addToMenu: (item: {
    name: string;
    price: number;
    description?: string;
    inventoryQuantity?: number | null;
    inventoryMinStockLevel?: number | null;
    inventoryUnit?: string;
    inventoryIsUnlimited?: boolean;
  }) => api.post('/addToMenu', item),
  updateMenuItem: (id: string, item: {
    name: string;
    price: number;
    description?: string;
    inventoryQuantity?: number | null;
    inventoryMinStockLevel?: number | null;
    inventoryUnit?: string;
    inventoryIsUnlimited?: boolean;
  }) => api.put(`/updateMenuItem/${id}`, item),
  deleteMenuItem: (id: string) =>
    api.delete(`/deleteMenuItem/${id}`),
};

export const salesService = {
  addToSales: (order: { customerName: string; items: any[]; totalAmount: number }) =>
    api.post('/addToSales', order),
  getSalesHistory: (filters?: any) =>
    api.get('/getSalesHistory', { params: filters }),
  updateOrderStatus: (id: string, status: 'served' | 'cancelled') =>
    api.patch(`/orders/${id}/status`, { status }),
};

export const inventoryService = {
  getInventoryItems: () => api.get('/inventory/items'),
  adjustStock: (id: string, adjustment: number) =>
    api.patch(`/inventory/items/${id}/stock`, { adjustment }),
};

export const rawMaterialService = {
  getRawMaterials: () => api.get('/raw-materials'),
  createRawMaterial: (material: {
    name: string;
    quantity: string | number;
    unit: string;
    category?: string;
    notes?: string;
    status?: string;
  }) => api.post('/raw-materials', material),
  updateRawMaterial: (id: string, material: Partial<{
    name: string;
    quantity: string | number;
    unit: string;
    category?: string;
    notes?: string;
    status?: string;
  }>) => api.put(`/raw-materials/${id}`, material),
  deleteRawMaterial: (id: string) => api.delete(`/raw-materials/${id}`),
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
