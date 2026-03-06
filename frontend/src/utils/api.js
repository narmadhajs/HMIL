import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const getToken = () => localStorage.getItem('token');
export const setToken = (token) => localStorage.setItem('token', token);
export const removeToken = () => localStorage.removeItem('token');
export const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');
export const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('user');

export const authAPI = {
  checkEmployee: (emp_id) => axios.post(`${API}/auth/check-employee`, { emp_id }),
  register: (data) => axios.post(`${API}/auth/register`, data),
  setPassword: (data) => axios.post(`${API}/auth/set-password`, data),
  login: (data) => axios.post(`${API}/auth/login`, data),
  forgotPassword: (email) => axios.post(`${API}/auth/forgot-password`, { email }),
  resetPassword: (data) => axios.post(`${API}/auth/reset-password`, data),
};

export const hallsAPI = {
  getAll: () => axios.get(`${API}/halls`),
  getSlots: (hallId, date, token) => axios.get(`${API}/halls/${hallId}/slots?date=${date}&token=${token}`),
};

export const bookingsAPI = {
  create: (data, token) => axios.post(`${API}/bookings?token=${token}`, data),
  getMyBookings: (token) => axios.get(`${API}/bookings/my-bookings?token=${token}`),
};

export const notificationsAPI = {
  getMyNotifications: (token) => axios.get(`${API}/notifications/my-notifications?token=${token}`),
  markAsRead: (id, token) => axios.put(`${API}/notifications/${id}/read?token=${token}`),
};

export const adminAPI = {
  getPendingBookings: (token) => axios.get(`${API}/admin/bookings/pending?token=${token}`),
  getAllBookings: (token) => axios.get(`${API}/admin/bookings/all?token=${token}`),
  approveBooking: (id, token) => axios.put(`${API}/admin/bookings/${id}/approve?token=${token}`),
  rejectBooking: (id, token) => axios.put(`${API}/admin/bookings/${id}/reject?token=${token}`),
  blockSlot: (data, token) => axios.post(`${API}/admin/slots/block?token=${token}`, data),
  modifyBooking: (id, data, token) => axios.put(`${API}/admin/bookings/${id}/modify?token=${token}`, data),
  initAdmin: () => axios.post(`${API}/admin/init`),
};