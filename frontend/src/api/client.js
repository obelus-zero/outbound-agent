import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const auth = {
  login: (email, password) =>
    api.post('/auth/login', new URLSearchParams({ username: email, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
}

// Prospects API
export const prospects = {
  list: (params) => api.get('/prospects', { params }),
  get: (id) => api.get(`/prospects/${id}`),
  create: (data) => api.post('/prospects', data),
  update: (id, data) => api.put(`/prospects/${id}`, data),
  delete: (id) => api.delete(`/prospects/${id}`),
  importCSV: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/prospects/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// Messages API
export const messages = {
  list: (params) => api.get('/messages', { params }),
  getForProspect: (prospectId) => api.get(`/messages/prospect/${prospectId}`),
  generate: (data) => api.post('/messages/generate', data),
  update: (id, data) => api.put(`/messages/${id}`, data),
  approve: (id) => api.post(`/messages/${id}/approve`),
  reject: (id) => api.post(`/messages/${id}/reject`),
  regenerate: (id) => api.post(`/messages/${id}/regenerate`),
  markSent: (id) => api.post(`/messages/${id}/mark-sent`),
}

// ICP API
export const icp = {
  list: () => api.get('/icp'),
  getActive: () => api.get('/icp/active'),
  get: (id) => api.get(`/icp/${id}`),
  create: (data) => api.post('/icp', data),
  update: (id, data) => api.put(`/icp/${id}`, data),
  delete: (id) => api.delete(`/icp/${id}`),
  setDefault: (id) => api.post(`/icp/${id}/set-default`),
  duplicate: (id) => api.post(`/icp/${id}/duplicate`),
  getSemgrepTemplate: () => api.get('/icp/templates/semgrep'),
}

// Workflow API
export const workflow = {
  getQueue: (params) => api.get('/workflow/queue', { params }),
  action: (prospectId, action) => api.post(`/workflow/${prospectId}/action`, null, { params: { action } }),
  getStats: () => api.get('/workflow/stats'),
}

// Sequences API
export const sequences = {
  getTemplates: () => api.get('/sequences/templates'),
  getForProspect: (prospectId) => api.get(`/sequences/prospect/${prospectId}`),
  create: (data) => api.post('/sequences', data),
  addStep: (sequenceId, step) => api.post(`/sequences/${sequenceId}/steps`, step),
  updateStep: (stepId, data) => api.put(`/sequences/steps/${stepId}`, data),
  deleteStep: (stepId) => api.delete(`/sequences/steps/${stepId}`),
  reorderSteps: (sequenceId, stepIds) => api.post(`/sequences/${sequenceId}/reorder`, { step_ids: stepIds }),
  completeStep: (stepId, responseReceived = false) =>
    api.post(`/sequences/steps/${stepId}/complete`, null, { params: { response_received: responseReceived } }),
  skipStep: (stepId) => api.post(`/sequences/steps/${stepId}/skip`),
}

// Integrations API
export const integrations = {
  getStatus: () => api.get('/integrations/status'),
  getSalesforceAuthUrl: () => api.get('/integrations/salesforce/auth-url'),
  syncSalesforce: () => api.post('/integrations/salesforce/sync'),
}

// Gmail API
export const gmail = {
  compose: (data) => api.post('/gmail/compose', data),
  status: () => api.get('/gmail/status'),
}

export default api
