import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/refresh-token`,
          {},
          { withCredentials: true }
        )
        return api(originalRequest)
      } catch (refreshError) {
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: (data) => api.post('/api/v1/auth/login', data),
  register: (data) => api.post('/api/v1/auth/register', data),
  logout: () => api.post('/api/v1/auth/logout'),
  me: () => api.get('/api/v1/auth/me'),
  sendOtp: (data) => api.post('/api/v1/auth/send-otp', data),
  verifyOtp: (data) => api.post('/api/v1/auth/verify-otp', data),
  forgotPassword: (data) => api.post('/api/v1/auth/forgot-password', data),
  resetPassword: (data) => api.post('/api/v1/auth/reset-password', data),
  changePassword: (data) => api.patch('/api/v1/auth/change-password', data),
  updateProfile: (data) =>
    api.patch('/api/v1/auth/update-profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  refreshToken: () => api.post('/api/v1/auth/refresh-token'),
}

export const searchService = {
  search: (params) => api.get('/api/v1/search', { params }),
}

export const stationService = {
  getAll: (params) => api.get('/api/v1/stations', { params }),
  getById: (id) => api.get(`/api/v1/stations/${id}`),
}

export const trainService = {
  getAll: (params) => api.get('/api/v1/trains', { params }),
  getById: (id) => api.get(`/api/v1/trains/${id}`),
}

export const scheduleService = {
  getAll: (params) => api.get('/api/v1/schedules', { params }),
  getById: (id) => api.get(`/api/v1/schedules/${id}`),
}

export const bookingService = {
  create: (data) => api.post('/api/v1/bookings', data),
  getMyBookings: () => api.get('/api/v1/bookings/myBooking'),
  getById: (id) => api.get(`/api/v1/bookings/${id}`),
  addMeals: (id, data) => api.post(`/api/v1/bookings/${id}/meals`, data),
}

export const pnrService = {
  check: (pnr) => api.get(`/api/v1/pnr/${pnr}`),
}

export const paymentService = {
  initiate: (data) => api.post('/api/v1/payments/initiate', data),
  verify: (data) => api.post('/api/v1/payments/verify', data),
}

export const cancellationService = {
  cancel: (data) => api.post('/api/v1/cancellations', data),
  getById: (id) => api.get(`/api/v1/cancellations/${id}`),
}

export const discountService = {
  validate: (data) =>
    api.post('/api/v1/discounts/validate', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getTypes: () => api.get('/api/v1/discounts/types'),
}

export const mealService = {
  getAll: () => api.get('/api/v1/meals'),
  getById: (id) => api.get(`/api/v1/meals/${id}`),
}

export default api
