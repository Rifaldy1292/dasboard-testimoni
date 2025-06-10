import axios, { type AxiosInstance } from 'axios'

interface APIOptions {
  headers?: object
  params?: object
  token?: string
}

const API = ({ headers = {}, params = {}, token }: APIOptions = {}): AxiosInstance => {
  const user = JSON.parse(localStorage.getItem('user') as string) ?? {}
  const API_URL =
    import.meta.env.NODE_ENV === 'production'
      ? import.meta.env.VITE_API_PRODUCTION
      : import.meta.env.VITE_API_DEVELOPMENT

  if (!API_URL) throw new Error('env invalid!')

  const BASE_URL = API_URL || 'http://localhost:3000'

  const instance = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: {
      'Content-type': 'application/json',
      Authorization: `Bearer ${token || user.token}`,
      ...headers
    },
    params
  })

  return instance
}

export default API
