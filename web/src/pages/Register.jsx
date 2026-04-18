import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Microscope, Loader2 } from 'lucide-react'
import { registerPatient, registerDoctor } from '../api/api'
import { useToast } from '../context/ToastContext'

export default function Register() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { addToast } = useToast()

  const [role, setRole] = useState(params.get('role') === 'doctor' ? 'doctor' : 'patient')
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', 
    // Patient
    age: '', blood_group: 'A+',
    // Doctor
    specialty: 'General Physician', hospital: '', phone: '', locality: ''
  })

  const update = (f) => (e) => setFormData(p => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (role === 'doctor') {
        const payload = {
          name: formData.name, email: formData.email, password: formData.password,
          specialty: formData.specialty, hospital: formData.hospital,
          phone: formData.phone, locality: formData.locality
        }
        await registerDoctor(payload)
      } else {
        const payload = {
          name: formData.name, email: formData.email, password: formData.password,
          age: formData.age, blood_group: formData.blood_group
        }
        await registerPatient(payload)
      }
      
      addToast("Account created successfully. Please sign in.")
      navigate(`/login?role=${role}`)
    } catch (err) {
      addToast(err.response?.data?.detail || t('common.error'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden fade-in py-12">
      <Link to="/" className="absolute top-6 left-6 text-subtitle hover:text-white flex items-center gap-2 transition-colors">
        <span className="text-xl">←</span> {t('common.back')}
      </Link>

      <div className="card w-full max-w-xl p-8 border border-gray-border shadow-2xl relative z-10 my-auto">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
            <Microscope className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-white mb-8 tracking-wide uppercase">
          {t('auth.signUp')}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Common */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-subtitle uppercase tracking-widest mb-1.5">{t('auth.name')}</label>
              <input required type="text" className="input-field" placeholder={t('auth.namePlaceholder')} value={formData.name} onChange={update('name')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-subtitle uppercase tracking-widest mb-1.5">{t('auth.email')}</label>
              <input required type="email" className="input-field" placeholder={t('auth.emailPlaceholder')} value={formData.email} onChange={update('email')} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-subtitle uppercase tracking-widest mb-1.5">{t('auth.password')}</label>
              <input required type="password" minLength="6" className="input-field" placeholder={t('auth.passwordPlaceholder')} value={formData.password} onChange={update('password')} />
            </div>

            {/* Patient Specific */}
            {role === 'patient' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-subtitle uppercase tracking-widest mb-1.5">{t('auth.age')}</label>
                  <input required type="number" className="input-field" placeholder="25" value={formData.age} onChange={update('age')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-subtitle uppercase tracking-widest mb-1.5">{t('auth.bloodGroup')}</label>
                  <select className="select-field" value={formData.blood_group} onChange={update('blood_group')}>
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Doctor Specific */}
            {role === 'doctor' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-subtitle uppercase tracking-widest mb-1.5">{t('auth.specialty')}</label>
                  <select className="select-field" value={formData.specialty} onChange={update('specialty')}>
                    {['Pulmonologist', 'Neurologist', 'Radiologist', 'Oncologist', 'Cardiologist', 'General Physician'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-subtitle uppercase tracking-widest mb-1.5">{t('auth.hospital')}</label>
                  <input required type="text" className="input-field" placeholder={t('auth.hospitalPlaceholder')} value={formData.hospital} onChange={update('hospital')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-subtitle uppercase tracking-widest mb-1.5">{t('auth.phone')}</label>
                  <input required type="tel" className="input-field" placeholder={t('auth.phonePlaceholder')} value={formData.phone} onChange={update('phone')} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-subtitle uppercase tracking-widest mb-1.5">{t('auth.locality')}</label>
                  <input required type="text" className="input-field" placeholder={t('auth.localityPlaceholder')} value={formData.locality} onChange={update('locality')} />
                </div>
              </>
            )}
          </div>
          
          <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('auth.signUp')}
          </button>
        </form>

        <p className="mt-6 text-center text-subtitle text-sm">
          {t('auth.haveAccount')}{' '}
          <Link to={`/login?role=${role}`} className="text-primary hover:underline font-semibold">
            {t('auth.signInLink')}
          </Link>
        </p>
      </div>
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
    </div>
  )
}
