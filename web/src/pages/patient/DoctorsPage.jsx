import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Building2, Stethoscope, MessageCircle, PhoneCall } from 'lucide-react'
import { getDoctors } from '../../api/api'

const SPECIALTIES = ['All', 'Pulmonologist', 'Neurologist', 'Radiologist', 'Oncologist', 'Cardiologist', 'General Physician']

export default function DoctorsPage() {
  const { t } = useTranslation()
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    setLoading(true)
    const spec = filter === 'All' ? '' : filter
    getDoctors(spec).then(data => setDoctors(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10 fade-in">
      
      <div className="text-center mb-10 border-b border-gray-border pb-10">
        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 border border-primary/30">
           <Stethoscope className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-widest">{t('doctors.title')}</h1>
        <p className="text-subtitle mt-2">{t('doctors.subtitle')}</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        {SPECIALTIES.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all border
              ${filter === s 
                ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                : 'bg-card text-subtitle border-gray-border hover:bg-gray-border hover:text-white'}`}
          >
            {s === 'All' ? t('doctors.all') : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
      ) : doctors.length === 0 ? (
        <div className="text-center p-16 card border border-gray-border">
          <p className="text-lg text-subtitle">{t('doctors.noResult')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {doctors.map(doc => (
            <div key={doc.id} className="card p-6 border border-gray-border hover:border-primary/50 transition-colors bg-gradient-to-br from-black to-card">
              
              <div className="flex items-start justify-between mb-4">
                <div className="bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                  {doc.specialty}
                </div>
              </div>

              <h2 className="text-xl font-bold text-white mb-2">{doc.name}</h2>
              
              <div className="space-y-3 mt-4 text-sm text-subtitle">
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 shrink-0 mt-0.5 text-primary-muted" />
                  <span>{doc.hospital}</span>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary-muted" />
                  <span>{doc.locality}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 shrink-0 mt-0.5 text-primary-muted" />
                  <span>{doc.phone}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-gray-border">
                <a href={`tel:${doc?.phone || ''}`} className="flex-1 btn-outline bg-black border-gray-border text-white hover:border-primary hover:bg-primary py-2.5">
                  <PhoneCall className="w-4 h-4" /> {t('doctors.call')}
                </a>
                <a href={`https://wa.me/${(doc?.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 btn-primary py-2.5 bg-[#25D366] hover:bg-[#1DA851]">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
