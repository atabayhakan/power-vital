import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

export const authService = {
  login: (credentials: any) => api.post('/auth/login', credentials),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const productService = {
  getProducts: () => api.get('/products'),
  getProductByBarcode: (barcode: string) => api.get(`/products/barcode/${barcode}`),
};

export const financeService = {
  getWallet: () => api.get('/finance/wallet'),
  payWithWallet: (data: any) => api.post('/finance/wallet/pay', data),
  getExchangeRate: () => api.get('/finance/exchange-rate'),
};
