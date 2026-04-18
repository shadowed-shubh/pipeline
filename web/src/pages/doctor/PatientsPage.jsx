import { useState, useEffect } from 'react'
import { getAllReports } from '../../api/mock'
import { Users, FileText, Activity } from 'lucide-react'
import ReportModal from '../../components/ReportModal'

export default function PatientsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAllReports().then(data => {
      if (Array.isArray(data)) setReports(data)
      else setReports([])
    }).catch(err => {
      console.error(err)
      setError(err.response?.data?.detail || err.message || "Failed to load patients")
    }).finally(() => setLoading(false))
  }, [])

  // Group reports by patient ID to mock a "Patients" view
  const patients = reports.reduce((acc, report) => {
    if (!acc[report.user_id]) {
        acc[report.user_id] = { id: report.user_id, reports: [], latest: report.date }
    }
    acc[report.user_id].reports.push(report)
    // Update latest if newer
    if (new Date(report.date) > new Date(acc[report.user_id].latest)) {
        acc[report.user_id].latest = report.date
    }
    return acc
  }, {})

  const patientList = Object.values(patients)

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10 fade-in">
      <div className="mb-10 pb-6 border-b border-gray-border">
         <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
           <Users className="w-8 h-8 text-primary" /> Network Patients
         </h1>
         <p className="text-subtitle mt-2">Aggregated overview of patients in the system</p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-start gap-3 mb-8">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="p-20 flex justify-center"><div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div></div>
      ) : patientList.length === 0 ? (
        <div className="card p-10 text-center border border-gray-border">
          <p className="text-subtitle text-lg">No patients found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patientList.map(p => (
            <div key={p.id} className="card bg-black/40 border border-gray-border overflow-hidden group">
              <div className="p-6">
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shadow-lg">
                      #{p.id}
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] uppercase tracking-widest text-subtitle font-bold">Total Scans</p>
                       <p className="text-2xl font-black text-white">{p.reports.length}</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4">
                    <div>
                      <p className="text-xs text-subtitle uppercase font-semibold mb-1">Latest Scan Date</p>
                      <p className="text-sm font-medium text-white bg-card px-3 py-1.5 rounded-lg border border-gray-border inline-block">{p.latest.split(' ')[0]}</p>
                    </div>
                 </div>
              </div>

              <div className="bg-card p-4 border-t border-gray-border">
                 <p className="text-xs text-subtitle font-semibold uppercase mb-3">Scan History</p>
                 <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                    {p.reports.map((r, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setSelectedReport(r)}
                        className="flex items-center justify-between p-2 rounded-lg bg-black hover:bg-black/60 border border-gray-border hover:border-primary/50 cursor-pointer transition-colors"
                      >
                         <span className="text-sm text-white truncate max-w-[120px]">{r?.disease || 'Scan'}</span>
                         <span className="text-xs font-mono text-primary-muted">{(r?.date || '').split(' ')[0]}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
    </div>
  )
}
