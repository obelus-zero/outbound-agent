import { create } from 'zustand'
import { auth } from '../api/client'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,

  login: async (email, password) => {
    try {
      const response = await auth.login(email, password)
      const { access_token } = response.data
      localStorage.setItem('token', access_token)
      set({ token: access_token })

      // Fetch user data
      const userResponse = await auth.me()
      set({ user: userResponse.data })

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login failed',
      }
    }
  },

  register: async (email, password, fullName) => {
    try {
      await auth.register({ email, password, full_name: fullName })
      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Registration failed',
      }
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isLoading: false })
      return
    }

    try {
      const response = await auth.me()
      set({ user: response.data, isLoading: false })
    } catch (error) {
      localStorage.removeItem('token')
      set({ user: null, token: null, isLoading: false })
    }
  },
}))

export default useAuthStore
