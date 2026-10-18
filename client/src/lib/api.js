import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
})

// Give every error a friendly message and a { field: message } map for forms
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const data = error.response?.data
    error.userMessage =
      data?.message ||
      (error.request ? 'Cannot reach the server. Check your connection.' : 'Something went wrong')
    error.fieldErrors = Array.isArray(data?.errors)
      ? Object.fromEntries(data.errors.map((e) => [e.field, e.message]))
      : {}
    return Promise.reject(error)
  }
)