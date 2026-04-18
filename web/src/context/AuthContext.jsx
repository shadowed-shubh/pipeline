import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem('token')  || null)
  const [role,  setRole]    = useState(() => localStorage.getItem('role')   || null)
  const [user,  setUser]    = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null') } catch { return null }
  })

  const login = useCallback((accessToken, userRole, userData) => {
    localStorage.setItem('token', accessToken)
    localStorage.setItem('role',  userRole)
    localStorage.setItem('user',  JSON.stringify(userData))
    setToken(accessToken)
    setRole(userRole)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user')
    setToken(null)
    setRole(null)
    setUser(null)
  }, [])

  const isAuthenticated = Boolean(token)

  return (
    <AuthContext.Provider value={{ token, role, user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
