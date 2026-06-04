import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import axios from 'axios'

// ═══ GLOBAL AXIOS CONFIG (Antigravity: single config for all API calls) ═══
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/'; // Uses Render/Railway API URL in production, proxy locally

// Auto-inject auth token on every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-redirect to login on 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname
      // Don't redirect if already on login/register/public pages
      if (!['/login', '/register', '/', '/about', '/contact'].includes(currentPath)) {
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        localStorage.removeItem('userId')
        router.push('/login')
      }
    }
    return Promise.reject(error)
  }
)

const app = createApp(App)
app.use(router)
app.mount('#app')
