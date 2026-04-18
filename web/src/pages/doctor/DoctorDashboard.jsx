import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, FileText, Activity, MapPin } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { getAllReports } from '../../api/mock'

export default function DoctorDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAllReports()
      .then(data => {
        if (Array.isArray(data)) {
          setReports([...data].reverse())
        } else {
          setReports([])
        }
      })
      .catch(err => {
        console.error(err)
        setError(err.response?.data?.detail || err.message || "Failed to load reports")
      })
      .finally(() => setLoading(false))
  }, [])

  // Stats
  const uniquePatients = new Set(reports.map(r => r?.user_id)).size
  
  // Calculate most common diagnosis
  const diagCount = reports.reduce((acc, r) => {
    const disease = r?.disease || 'Unknown'
    acc[disease] = (acc[disease] || 0) + 1
    return acc
  }, {})
  let commonDiag = "—"
  let maxCount = 0
  for (let d in diagCount) {
    if (diagCount[d] > maxCount) {
      commonDiag = d
      maxCount = diagCount[d]
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-10 fade-in">
      
      {/* Header */}
      <div className="mb-10 card p-6 border border-gray-border flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-black to-primary/5">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t('doctor.dashTitle')}</h1>
          <p className="text-subtitle font-medium">Welcome, <span className="text-primary">{user?.name}</span></p>
        </div>
        <div className="flex flex-col gap-1 items-start md:items-end text-sm text-subtitle">
           <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-lg border border-gray-border"><MapPin className="w-4 h-4 text-primary"/> {user?.hospital || 'Hospital'}</div>
           <div className="px-3 py-1.5 text-primary bg-primary/10 font-bold uppercase tracking-wider rounded-lg border border-primary/20 text-xs">
             {user?.specialty || 'General'}
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="card p-6 border border-gray-border flex items-center gap-5 relative overflow-hidden">
           <div className="w-14 h-14 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 relative z-10"><Users className="w-7 h-7" /></div>
           <div className="relative z-10">
             <p className="text-subtitle font-semibold text-sm uppercase tracking-wide mb-1">{t('doctor.totalPts')}</p>
             <h2 className="text-3xl font-bold text-white">{uniquePatients}</h2>
           </div>
           <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-blue-900/10 to-transparent"></div>
        </div>
        <div className="card p-6 border border-gray-border flex items-center gap-5 relative overflow-hidden">
           <div className="w-14 h-14 rounded-full bg-green-900/30 flex items-center justify-center text-green-400 relative z-10"><FileText className="w-7 h-7" /></div>
           <div className="relative z-10">
             <p className="text-subtitle font-semibold text-sm uppercase tracking-wide mb-1">Total Network Reports</p>
             <h2 className="text-3xl font-bold text-white">{reports.length}</h2>
           </div>
           <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-green-900/10 to-transparent"></div>
        </div>
        <div className="card p-6 border border-gray-border flex items-center gap-5 relative overflow-hidden">
           <div className="w-14 h-14 rounded-full bg-purple-900/30 flex items-center justify-center text-purple-400 relative z-10"><Activity className="w-7 h-7" /></div>
           <div className="relative z-10">
             <p className="text-subtitle font-semibold text-sm uppercase tracking-wide mb-1">{t('doctor.commonDiag')}</p>
             <h2 className="text-xl font-bold text-white truncate max-w-[150px]" title={commonDiag}>{commonDiag}</h2>
           </div>
           <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-purple-900/10 to-transparent"></div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card border border-gray-border flex flex-col">
          <div className="p-6 border-b border-gray-border flex justify-between items-center bg-black/20 rounded-t-2xl">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">Platform Scan Feed</h3>
          </div>
          
          <div className="p-4">
            {error ? (
              <p className="p-4 text-center text-red-400">{error}</p>
            ) : loading ? (
              <p className="p-4 text-center text-subtitle">Loading feed...</p>
            ) : reports.length === 0 ? (
              <p className="p-8 text-center text-subtitle">No reports in the system.</p>
            ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                    <thead className="text-xs text-subtitle uppercase bg-black/40 border-b border-gray-border">
                        <tr>
                            <th className="px-6 py-4 rounded-tl-lg">Patient ID</th>
                            <th className="px-6 py-4">Diagnosis</th>
                            <th className="px-6 py-4">Confidence</th>
                            <th className="px-6 py-4 rounded-tr-lg">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.slice(0, 10).map((r) => (
                            <tr key={r.id} className="border-b border-gray-border/50 hover:bg-card/80 transition-colors">
                                <td className="px-6 py-4 font-mono text-primary">#{r.user_id}</td>
                                <td className="px-6 py-4 font-semibold text-white">{r.disease}</td>
                                <td className="px-6 py-4">
                                  <span className="badge-blue">{(r.confidence * 100).toFixed(1)}%</span>
                                </td>
                                <td className="px-6 py-4 text-subtitle">{r.date}</td>
                            </tr>
                        ))}
                    </tbody>
                 </table>
               </div>
            )}
          </div>
      </div>

    </div>
  )
}
