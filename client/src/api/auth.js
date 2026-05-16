import api from './index'

export function login(data) {
  return api.post('/auth/login', data)
}

export function getCurrentUser() {
  return api.get('/auth/me')
}

export function logout() {
  return api.post('/auth/logout')
}
