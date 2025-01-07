import axios, { type AxiosInstance } from 'axios'

const API = ({ headers = {}, params = {} } = {}): AxiosInstance => {
  const user = JSON.parse(localStorage.getItem('user') as string) ?? {}
  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

  if (!BASE_URL) {
    throw new Error('VITE_API_URL is not defined')
  }

  const instance = axios.create({
    baseURL: `${BASE_URL}/api`,
    headers: {
      'Content-type': 'application/json',
      Authorization: `Bearer ${user.token}`,
      ...headers
    },
    params
  })

  return instance
}

export default API
