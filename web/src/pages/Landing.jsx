import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Microscope, User, Stethoscope } from 'lucide-react'
import SplashScreen from '../components/SplashScreen'
import LanguageSelector from '../components/LanguageSelector'
import { useAuth } from '../context/AuthContext'
import { ping } from '../api/api'

export default function Landing() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isAuthenticated, role } = useAuth()
  
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown')
  })

  // Ping server on load to wake up free tier
  useEffect(() => {
    ping().catch(() => {})
  }, [])


  const handleSplashDone = () => {
    sessionStorage.setItem('splashShown', 'true')
    setShowSplash(false)
  }

  if (showSplash) {
    return <SplashScreen onDone={handleSplashDone} />
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden fade-in">
      
      {/* Top right language */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSelector floating={true} />
      </div>

      <div className="relative z-10 flex flex-col items-center max-w-2xl text-center px-6">
        
        {/* Animated Icon */}
        <div className="relative mb-12">
           <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring-1 blur-md" />
           <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-ring-2 blur-sm" />
           <div className="w-24 h-24 rounded-full bg-card border border-primary/30 flex items-center justify-center relative z-10 shadow-[0_0_40px_rgba(61,123,245,0.2)]">
             <Microscope className="w-12 h-12 text-primary" />
           </div>
        </div>

        <h1 className="text-5xl md:text-6xl font-black tracking-[0.25em] text-white mb-6">
          {t('landing.title')}
        </h1>
        
        <p className="text-xl md:text-2xl text-subtitle font-light tracking-wide mb-16 max-w-lg">
          {t('landing.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
          <button 
            onClick={() => navigate('/login?role=patient')}
            className="flex-1 btn-primary text-lg py-4 group"
          >
            <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {t('landing.patientLogin')}
          </button>
          
          <button 
            onClick={() => navigate('/login?role=doctor')}
            className="flex-1 btn-outline text-lg py-4 bg-card group"
            style={{ borderColor: '#2A2A2A', color: 'white' }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3D7BF5'; e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = '#3D7BF5' }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = '#2A2A2A'; e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = '#1C1C1C' }}
          >
            <Stethoscope className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {t('landing.doctorLogin')}
          </button>
        </div>
      </div>
      
      {/* Background decoration */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  )
}
