import { useState, useEffect } from 'react'
import { getAllReports } from '../../api/mock'
import { FileText, Search, Download } from 'lucide-react'
import ReportModal from '../../components/ReportModal'
import { generatePDF } from '../../utils/pdf'

export default function ReportsPage() {
  const [reports, setReports] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    getAllReports().then(data => {
      let sorted = []
      if (Array.isArray(data)) sorted = [...data].reverse()
      setReports(sorted)
      setFiltered(sorted)
    }).catch(err => {
      console.error(err)
      setError(err.response?.data?.detail || err.message || "Failed to load reports")
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!search) setFiltered(reports)
    else {
      setFiltered(reports.filter(r => 
        (r?.disease || '').toLowerCase().includes(search.toLowerCase()) || 
        (r?.user_id || '').toString().includes(search)
      ))
    }
  }, [search, reports])

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10 fade-in">
       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b border-gray-border pb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center gap-3">
             <FileText className="w-8 h-8 text-primary" /> Platform Reports
          </h1>
          <p className="text-subtitle mt-2">Complete diagnostic history across the network</p>
        </div>
        
        <div className="relative max-w-sm w-full">
           <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-subtitle" />
           <input 
             type="text" 
             placeholder="Search diagnosis or patient ID..." 
             className="w-full bg-card border border-gray-border text-white text-sm rounded-xl pl-10 pr-4 py-3 focus:border-primary focus:outline-none transition-colors"
             value={search}
             onChange={e => setSearch(e.target.value)}
           />
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-4 rounded-xl flex items-start gap-3 mb-8">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {loading ? (
         <div className="p-20 flex justify-center"><div className="w-10 h-10 flex border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div></div>
      ) : filtered.length === 0 ? (
         <div className="card border border-gray-border p-16 text-center">
            <h3 className="text-xl font-bold text-white mb-2">No reports match search</h3>
         </div>
      ) : (
         <div className="card border border-gray-border overflow-hidden">
            <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="text-xs text-subtitle uppercase bg-black/60 border-b border-gray-border">
                     <tr>
                        <th className="px-6 py-5 rounded-tl-lg">Report ID</th>
                        <th className="px-6 py-5">Patient ID</th>
                        <th className="px-6 py-5">Diagnosis</th>
                        <th className="px-6 py-5">Confidence</th>
                        <th className="px-6 py-5">Date</th>
                        <th className="px-6 py-5 text-right rounded-tr-lg">Action</th>
                     </tr>
                  </thead>
                  <tbody>
                     {filtered.map(r => (
                        <tr key={r.id} className="border-b border-gray-border flex-col hover:bg-card/40 transition-colors group cursor-pointer" onClick={() => setSelectedReport(r)}>
                           <td className="px-6 py-4 font-mono text-subtitle">#{r.id}</td>
                           <td className="px-6 py-4 font-mono text-primary font-bold">PT-{r.user_id}</td>
                           <td className="px-6 py-4 font-semibold text-white">{r.disease}</td>
                           <td className="px-6 py-4">
                              <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded text-xs font-bold">
                                {(r.confidence * 100).toFixed(1)}%
                              </span>
                           </td>
                           <td className="px-6 py-4 text-subtitle font-mono text-xs">{r.date}</td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                onClick={(e) => { e.stopPropagation(); generatePDF(`Patient ${r.user_id}`, r) }}
                                className="text-subtitle hover:text-primary p-2 transition-colors inline-flex"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      )}

      <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
    </div>
  )
}
