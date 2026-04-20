import { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import ChatBot from './components/ChatBot'

// Pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/patient/Dashboard'
import ScanPage from './pages/patient/ScanPage'
import HistoryPage from './pages/patient/HistoryPage'
import DoctorsPage from './pages/patient/DoctorsPage'

import DoctorDashboard from './pages/doctor/DoctorDashboard'
import PatientsPage from './pages/doctor/PatientsPage'
import ReportsPage from './pages/doctor/ReportsPage'

// Layout wrapper for authenticated pages
function AppLayout({ children }) {
  return (
    <div className="flex bg-black min-h-screen text-white font-sans overflow-hidden">
      <div className="hidden md:block">
         <Sidebar />
      </div>
      
      <main className="flex-1 overflow-y-auto relative custom-scrollbar">
         {/* Mobile Menu Spacer - would add a hamburger here in real prod */}
        {children}
        <ChatBot />
      </main>
    </div>
  )
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/welcome" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Patient Routes */}
      <Route path="/user/dashboard" element={<ProtectedRoute requiredRole="patient"><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/user/scan" element={<ProtectedRoute requiredRole="patient"><AppLayout><ScanPage /></AppLayout></ProtectedRoute>} />
      <Route path="/user/history" element={<ProtectedRoute requiredRole="patient"><AppLayout><HistoryPage /></AppLayout></ProtectedRoute>} />
      <Route path="/user/doctors" element={<ProtectedRoute requiredRole="patient"><AppLayout><DoctorsPage /></AppLayout></ProtectedRoute>} />

      {/* Doctor Routes */}
      <Route path="/doctor/dashboard" element={<ProtectedRoute requiredRole="doctor"><AppLayout><DoctorDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/doctor/patients" element={<ProtectedRoute requiredRole="doctor"><AppLayout><PatientsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/doctor/reports" element={<ProtectedRoute requiredRole="doctor"><AppLayout><ReportsPage /></AppLayout></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  // --- Security: Clear legacy mock sessions ---
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && token.startsWith('mock-')) {
      console.log('Legacy mock session detected. Clearing...')
      localStorage.clear()
      window.location.reload()
    }
  }, [])

  return (
    <HashRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </HashRouter>
  )
}
