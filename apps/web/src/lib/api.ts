import axios, { AxiosError } from 'axios';
import { getSession, signOut } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT from next-auth session
api.interceptors.request.use(async (config) => {
  const session = await getSession();
  // If the refresh token has also expired, force sign-out
  if ((session as any)?.error === 'RefreshAccessTokenError') {
    signOut({ callbackUrl: '/login' });
    return Promise.reject(new Error('Session expired. Please log in again.'));
  }
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});

// Error normalizer — 401 means session is gone, redirect to login
api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<{ message?: string }>) => {
    if (error.response?.status === 401) {
      signOut({ callbackUrl: '/login' });
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
    const msg =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(Array.isArray(msg) ? msg.join(', ') : msg));
  },
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
  register: (data: any) =>
    api.post('/auth/register', data).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data),
};

// ─── Shipments ─────────────────────────────────────────────────────────────
export const shipmentsApi = {
  browse: (params?: any) =>
    api.get('/shipments/browse', { params }).then((r) => r.data),
  myShipments: (params?: any) =>
    api.get('/shipments/my', { params }).then((r) => r.data),
  myStats: () =>
    api.get('/shipments/my/stats').then((r) => r.data),
  getOne: (id: string) =>
    api.get(`/shipments/${id}`).then((r) => r.data),
  create: (data: any) =>
    api.post('/shipments', data).then((r) => r.data),
  update: (id: string, data: any) =>
    api.patch(`/shipments/${id}`, data).then((r) => r.data),
  cancel: (id: string) =>
    api.delete(`/shipments/${id}`).then((r) => r.data),
  uploadImage: (shipmentId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/shipments/${shipmentId}/images`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  deleteImage: (shipmentId: string, imageId: string) =>
    api.delete(`/shipments/${shipmentId}/images/${imageId}`).then((r) => r.data),
};

// ─── Bids ──────────────────────────────────────────────────────────────────
export const bidsApi = {
  place: (data: any) =>
    api.post('/bids', data).then((r) => r.data),
  myBids: () =>
    api.get('/bids/my').then((r) => r.data),
  forShipment: (shipmentId: string) =>
    api.get(`/bids/shipment/${shipmentId}`).then((r) => r.data),
  accept: (bidId: string) =>
    api.patch(`/bids/${bidId}/accept`).then((r) => r.data),
  withdraw: (bidId: string) =>
    api.patch(`/bids/${bidId}/withdraw`).then((r) => r.data),
};

// ─── Bookings ──────────────────────────────────────────────────────────────
export const bookingsApi = {
  driverJobs: () =>
    api.get('/bookings/my/driver').then((r) => r.data),
  driverStats: () =>
    api.get('/bookings/my/driver/stats').then((r) => r.data),
  shipperBookings: () =>
    api.get('/bookings/my/shipper').then((r) => r.data),
  getOne: (id: string) =>
    api.get(`/bookings/${id}`).then((r) => r.data),
  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch(`/bookings/${id}/status`, { status, notes }).then((r) => r.data),
  getMessages: (id: string) =>
    api.get(`/bookings/${id}/messages`).then((r) => r.data),
  sendMessage: (id: string, content: string) =>
    api.post(`/bookings/${id}/messages`, { content }).then((r) => r.data),
};

// ─── Documents ─────────────────────────────────────────────────────────────
export const documentsApi = {
  upload: (file: File, type: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    return api.post('/documents/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
  myDocuments: () =>
    api.get('/documents/my').then((r) => r.data),
  delete: (id: string) =>
    api.delete(`/documents/${id}`).then((r) => r.data),
};

// ─── Admin ─────────────────────────────────────────────────────────────────
export const adminApi = {
  stats: () =>
    api.get('/admin/stats').then((r) => r.data),
  users: (params?: any) =>
    api.get('/admin/users', { params }).then((r) => r.data),
  updateUserStatus: (userId: string, status: string, notes?: string) =>
    api.patch(`/admin/users/${userId}/status`, { status, notes }).then((r) => r.data),
  shipments: (params?: any) =>
    api.get('/admin/shipments', { params }).then((r) => r.data),
  updateShipmentStatus: (shipmentId: string, status: string) =>
    api.patch(`/admin/shipments/${shipmentId}/status`, { status }).then((r) => r.data),
  bookings: (params?: any) =>
    api.get('/admin/bookings', { params }).then((r) => r.data),
  pendingDocuments: () =>
    api.get('/admin/documents/pending').then((r) => r.data),
  reviewDocument: (docId: string, status: string, notes?: string) =>
    api.patch(`/admin/documents/${docId}/review`, { status, notes }).then((r) => r.data),
  driversForVerification: (params?: any) =>
    api.get('/admin/drivers/verification', { params }).then((r) => r.data),
  updateDriverVerification: (driverId: string, status: string, notes?: string) =>
    api.patch(`/admin/drivers/${driverId}/verification`, { status, notes }).then((r) => r.data),
  auditLogs: (params?: any) =>
    api.get('/admin/audit-logs', { params }).then((r) => r.data),
  contactMessages: (params?: any) =>
    api.get('/admin/contact-messages', { params }).then((r) => r.data),
  markContactRead: (id: string) =>
    api.patch(`/admin/contact-messages/${id}/read`).then((r) => r.data),
  setUserRole: (userId: string, role: string) =>
    api.patch(`/admin/users/${userId}/role`, { role }).then((r) => r.data),
  createAdmin: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/admin/users/create-admin', data).then((r) => r.data),
  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`).then((r) => r.data),
};

// ─── Users ─────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () => api.get('/users/me').then((r) => r.data),
  updateProfile: (data: any) =>
    api.patch('/users/me/profile', data).then((r) => r.data),
  driverProfile: () =>
    api.get('/users/me/driver-profile').then((r) => r.data),
  updateDriverProfile: (data: any) =>
    api.patch('/users/me/driver-profile', data).then((r) => r.data),
  publicDriverProfile: (driverId: string) =>
    api.get(`/users/driver/${driverId}/public`).then((r) => r.data),
};

// ─── Contact ───────────────────────────────────────────────────────────────
export const contactApi = {
  submit: (data: { firstName: string; lastName: string; email: string; company?: string; subject: string; message: string }) =>
    api.post('/contact', data).then((r) => r.data),
};

// ─── Notifications ─────────────────────────────────────────────────────────
export const notificationsApi = {
  getAll: () => api.get('/notifications').then((r) => r.data),
  unreadCount: () => api.get('/notifications/unread-count').then((r) => r.data),
  readAll: () => api.patch('/notifications/read-all').then((r) => r.data),
};
