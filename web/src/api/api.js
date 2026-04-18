import axios from 'axios'

const BASE_URL = 'https://pipeline-1-ch5e.onrender.com'

const api = axios.create({ baseURL: BASE_URL })

// Auto-attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      localStorage.removeItem('user')
      // Redirect to login with hash for HashRouter
      window.location.href = '/#/login'
    }
    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────────────────
export const registerPatient = (data) =>
  api.post('/register', data).then(r => r.data)

export const registerDoctor = (data) =>
  api.post('/register-doctor', data).then(r => r.data)

export const loginPatient = (email, password) =>
  api.post('/login', { email, password }).then(r => r.data)

export const loginDoctor = (email, password) =>
  api.post('/login-doctor', { email, password }).then(r => r.data)

// ── Diagnose ─────────────────────────────────────────────────
export const diagnose = (file) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/diagnose', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(r => r.data)
}

// ── History ──────────────────────────────────────────────────
export const getHistory = () =>
  api.get('/history').then(r => r.data)

export const addHistory = (data) =>
  api.post('/history', data).then(r => r.data)

// ── Doctors ──────────────────────────────────────────────────
export const getDoctors = (specialty = '') =>
  api.get('/doctors', { params: specialty ? { specialty } : {} }).then(r => r.data)

// ── Voice report ─────────────────────────────────────────────
export const getVoiceReport = () =>
  api.get('/voice-report', { responseType: 'blob' }).then(r => r.data)

// ── Chat ─────────────────────────────────────────────────────
export const chat = (message, context = '') =>
  api.post('/chat', { message, context }).then(r => r.data)

// ── Doctor endpoints ─────────────────────────────────────────
export const getAllReports = () =>
  api.get('/doctor/all-reports').then(r => r.data)

// ── Server ping ──────────────────────────────────────────────
export const ping = () => api.get('/').then(r => r.data)

export default api
