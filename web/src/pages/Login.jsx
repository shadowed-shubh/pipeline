import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Microscope, Loader2 } from 'lucide-react'
import { loginPatient, loginDoctor } from '../api/mock'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { login } = useAuth()
  const { addToast } = useToast()

  const [role, setRole] = useState(params.get('role') === 'doctor' ? 'doctor' : 'patient')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return addToast("Please fill all fields", "warning")
    
    setLoading(true)
    try {
      const res = role === 'doctor' 
        ? await loginDoctor(email, password)
        : await loginPatient(email, password)
      
      login(res.access_token, res.role, res.user)
      addToast(`Welcome back, ${res.user.name}`)
      navigate(res.role === 'doctor' ? '/doctor/dashboard' : '/user/dashboard')
    } catch (err) {
      addToast(err.response?.data?.detail || t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden fade-in">
      <Link to="/" className="absolute top-6 left-6 text-subtitle hover:text-white flex items-center gap-2 transition-colors">
        <span className="text-xl">←</span> {t('common.back')}
      </Link>

      <div className="card w-full max-w-md p-8 border border-gray-border shadow-2xl relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <Microscope className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-white mb-8 tracking-wide uppercase">
          {t('auth.signIn')}
        </h2>

        {/* Role Toggle */}
        <div className="flex bg-black p-1 rounded-xl border border-gray-border mb-8">
          <button 
            type="button"
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${role === 'patient' ? 'bg-primary text-white shadow-md' : 'text-subtitle hover:text-white'}`}
            onClick={() => setRole('patient')}
          >
            {t('auth.patient')}
          </button>
          <button 
            type="button"
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${role === 'doctor' ? 'bg-primary text-white shadow-md' : 'text-subtitle hover:text-white'}`}
            onClick={() => setRole('doctor')}
          >
            {t('auth.doctor')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-subtitle uppercase tracking-widest mb-1.5">{t('auth.email')}</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder={t('auth.emailPlaceholder')}
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-subtitle uppercase tracking-widest mb-1.5">{t('auth.password')}</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder={t('auth.passwordPlaceholder')}
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.signIn')}
          </button>
        </form>

        <p className="mt-8 text-center text-subtitle text-sm">
          {t('auth.noAccount')}{' '}
          <Link to={`/register?role=${role}`} className="text-primary hover:underline font-semibold">
            {t('auth.signUpLink')}
          </Link>
        </p>
      </div>
      
       <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  )
}
