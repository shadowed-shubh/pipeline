import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { Microscope, History, Stethoscope, LogOut, Users, FileText, User, LayoutDashboard } from 'lucide-react'
import LanguageSelector from './LanguageSelector'

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
         ${isActive
           ? 'bg-primary text-white'
           : 'text-subtitle hover:text-white hover:bg-card'}`
      }
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span>{label}</span>
    </NavLink>
  )
}

export default function Sidebar() {
  const { role, user, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleLogout = () => { logout(); navigate('/') }

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-black border-r border-gray-border px-4 py-6 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
          <Microscope className="w-5 h-5 text-primary" />
        </div>
        <span className="text-white font-black tracking-[0.15em] text-lg">AURALYSIS</span>
      </div>

      {/* Nav links */}
      <nav className="flex flex-col gap-1 flex-1">
        {role === 'patient' ? (
          <>
            <NavItem to="/user/dashboard" icon={LayoutDashboard} label={t('nav.dashboard')} />
            <NavItem to="/user/scan"      icon={Microscope}      label={t('nav.newScan')} />
            <NavItem to="/user/history"   icon={History}         label={t('nav.history')} />
            <NavItem to="/user/doctors"   icon={Stethoscope}     label={t('nav.findDoctors')} />
          </>
        ) : (
          <>
            <NavItem to="/doctor/dashboard" icon={LayoutDashboard} label={t('nav.dashboard')} />
            <NavItem to="/doctor/patients"  icon={Users}           label={t('nav.myPatients')} />
            <NavItem to="/doctor/reports"   icon={FileText}        label={t('nav.allReports')} />
          </>
        )}
      </nav>

      {/* Bottom: language + user + logout */}
      <div className="flex flex-col gap-3 pt-4 border-t border-gray-border">
        <LanguageSelector />

        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">{user?.name || 'User'}</p>
            <p className="text-subtitle text-xs capitalize">{role}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-subtitle hover:text-red-400 hover:bg-red-900/20 transition-all duration-200 text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  )
}
