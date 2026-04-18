import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, CheckCircle, ShieldAlert, ChevronRight, Activity, Microscope } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getHistory } from '../../api/mock'
import { useNavigate } from 'react-router-dom'
import ReportModal from '../../components/ReportModal'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getHistory()
      .then(data => {
        if (Array.isArray(data)) {
          setHistory([...data].reverse())
        } else {
          setHistory([])
        }
      })
      .catch(err => {
        console.error(err)
        setError(err.response?.data?.detail || err.message || "Failed to load history")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const stats = {
    total: history.length,
    latestStatus: history.length > 0 ? history[0]?.disease || '—' : '—',
    latestConf: history.length > 0 ? ((history[0]?.confidence || 0) * 100).toFixed(1) + '%' : '—'
  }

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10 fade-in">
      
      {/* Header */}
      <div className="mb-10 flex border border-gray-border bg-card/50 p-6 rounded-2xl items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('common.welcome')}, <span className="text-primary">{user?.name}</span></h1>
          <p className="text-subtitle">{t('scan.subtitle')}</p>
        </div>
        {user?.blood_group && (
           <div className="hidden sm:flex flex-col items-center justify-center p-4 rounded-xl bg-black border border-red-900/40 min-w-24">
             <span className="text-xs text-red-400 font-bold uppercase tracking-widest mb-1">Blood</span>
             <span className="text-2xl font-black text-white">{user.blood_group}</span>
           </div>
        )}
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-start gap-3 mb-8">
          <ShieldAlert className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-400" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card p-6 border border-gray-border flex items-center gap-5">
           <div className="w-14 h-14 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400"><FileText className="w-7 h-7" /></div>
           <div>
             <p className="text-subtitle font-semibold text-sm uppercase tracking-wide mb-1">Total Reports</p>
             <h2 className="text-3xl font-bold text-white">{stats.total}</h2>
           </div>
        </div>
        <div className="card p-6 border border-gray-border flex items-center gap-5">
           <div className="w-14 h-14 rounded-full bg-green-900/30 flex items-center justify-center text-green-400"><CheckCircle className="w-7 h-7" /></div>
           <div>
             <p className="text-subtitle font-semibold text-sm uppercase tracking-wide mb-1">Latest Status</p>
             <h2 className="text-2xl font-bold text-white truncate max-w-[150px]">{stats.latestStatus}</h2>
           </div>
        </div>
        <div className="card p-6 border border-gray-border flex items-center gap-5">
           <div className="w-14 h-14 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400"><ShieldAlert className="w-7 h-7" /></div>
           <div>
             <p className="text-subtitle font-semibold text-sm uppercase tracking-wide mb-1">AI Confidence</p>
             <h2 className="text-3xl font-bold text-white">{stats.latestConf}</h2>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Reports List */}
        <div className="lg:col-span-2 card border border-gray-border flex flex-col">
          <div className="p-6 border-b border-gray-border flex justify-between items-center bg-black/20 rounded-t-2xl">
            <h3 className="font-bold text-lg text-white flex items-center gap-2"><Activity className="w-5 h-5 text-primary"/> Recent clinical scans</h3>
            <button onClick={() => navigate('/user/history')} className="text-primary text-sm font-semibold hover:underline">View All</button>
          </div>
          
          <div className="p-2 flex-1">
            {loading ? (
              <p className="text-subtitle p-4 text-center">Loading...</p>
            ) : history.length === 0 ? (
              <div className="text-center p-10">
                <p className="text-subtitle mb-4">No reports found.</p>
                <button onClick={() => navigate('/user/scan')} className="btn-outline text-sm">Start an AI Scan</button>
              </div>
            ) : (
              <div className="space-y-1">
                {history.slice(0, 5).map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedReport(item)}
                    className="flex items-center justify-between p-4 rounded-xl hover:bg-black/40 cursor-pointer transition-colors border border-transparent hover:border-gray-border group"
                  >
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-full bg-card border border-gray-border flex items-center justify-center text-primary-dark shrink-0">
                         <FileText className="w-5 h-5" />
                       </div>
                       <div>
                         <h4 className="text-white font-bold mb-1">{item?.disease || 'Unknown'}</h4>
                         <p className="text-subtitle text-xs">{item?.date || ''}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <span className="badge-blue hidden sm:inline-block">{((item?.confidence || 0) * 100).toFixed(1)}% Conf</span>
                        <ChevronRight className="w-5 h-5 text-subtitle group-hover:text-primary transition-colors" />
                     </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / CTA */}
        <div className="card p-6 border border-gray-border bg-gradient-to-br from-[#1C1C1C] to-[#0A1A3A] relative overflow-hidden flex flex-col justify-center min-h-[300px]">
           <div className="relative z-10 text-center">
             <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                <Microscope className="w-8 h-8 text-primary" />
             </div>
             <h3 className="text-xl font-bold text-white mb-3">Require a new analysis?</h3>
             <p className="text-subtitle text-sm mb-8 leading-relaxed max-w-[250px] mx-auto">Upload MRI, X-Ray, or CT Scans for instant medical AI interpretation.</p>
             <button onClick={() => navigate('/user/scan')} className="btn-primary w-full shadow-lg shadow-primary/20">Start Diagnostic Scan</button>
           </div>
           
           {/* Decor */}
           <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 blur-3xl rounded-full" />
        </div>

      </div>

      <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
    </div>
  )
}
