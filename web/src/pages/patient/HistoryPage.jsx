import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Download, ChevronRight, Calendar, Search } from 'lucide-react'
import { getHistory } from '../../api/mock'
import ReportModal from '../../components/ReportModal'
import { generatePDF } from '../../utils/pdf'
import { useAuth } from '../../context/AuthContext'

export default function HistoryPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  
  const [history, setHistory] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    setError(null)
    getHistory().then(data => {
      let sorted = []
      if (Array.isArray(data)) {
        sorted = [...data].reverse()
      }
      setHistory(sorted)
      setFiltered(sorted)
    }).catch(err => {
      console.error(err)
      setError(err.response?.data?.detail || err.message || "Failed to load history")
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!search) setFiltered(history)
    else {
      setFiltered(history.filter(h => 
        h.disease.toLowerCase().includes(search.toLowerCase()) || 
        h.date.includes(search)
      ))
    }
  }, [search, history])

  const handleDownload = (e, item) => {
    e.stopPropagation()
    // format report object for generator
    const reportData = {
      disease: item.disease,
      confidence: item.confidence,
      report_summary: item.report_summary
    }
    generatePDF(user?.name, reportData)
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-10 fade-in">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b border-gray-border pb-6">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-widest">{t('history.title')}</h1>
          <p className="text-subtitle mt-2">{t('history.subtitle')}</p>
        </div>
        
        <div className="relative max-w-sm w-full">
           <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-subtitle" />
           <input 
             type="text" 
             placeholder="Search diagnosis or date..." 
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
        <div className="flex flex-col items-center justify-center p-20 text-subtitle space-y-4">
           <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
           <p className="animate-pulse">{t('common.loading')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card border border-gray-border p-16 text-center shadow-xl">
          <div className="w-20 h-20 bg-black rounded-full border flex items-center justify-center border-gray-border mx-auto mb-6 text-primary-muted">
             <FileText className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{search ? "No matches found" : t('history.empty')}</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map(item => {
            const data = typeof item.report_summary === 'string' ? (()=>{try{return JSON.parse(item.report_summary)}catch{return {}}})() : item.report_summary
            const severity = data?.severity_level || (item.confidence > 0.8 ? 'High' : item.confidence > 0.5 ? 'Moderate' : 'Low')
            const sevColor = severity.toLowerCase() === 'high' ? 'bg-red-900/40 text-red-400 border-red-900/50' : 
                             severity.toLowerCase() === 'moderate' ? 'bg-orange-900/40 text-orange-400 border-orange-900/50' : 
                             'bg-green-900/40 text-green-400 border-green-900/50'

            return (
              <div 
                key={item.id}
                onClick={() => setSelectedReport(item)}
                className="group card bg-black/40 border border-gray-border p-6 hover:border-primary/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-primary/5 relative overflow-hidden"
              >
                {/* Decor Top Line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/0 via-primary/0 to-primary/0 group-hover:from-primary/20 group-hover:via-primary/50 group-hover:to-primary/20 transition-all duration-500"></div>

                <div className="flex items-start justify-between mb-4">
                  <div className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-widest rounded-md border ${sevColor}`}>
                     {severity}
                  </div>
                  <div className="flex items-center gap-1.5 text-subtitle text-xs font-semibold bg-card px-2.5 py-1 rounded-md border border-gray-border">
                     <Calendar className="w-3.5 h-3.5" />
                     {item.date.split(' ')[0]}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white mb-1 truncate pr-4">{item.disease}</h3>
                <p className="text-primary text-sm font-semibold mb-6 tracking-wide">{(item.confidence * 100).toFixed(1)}% {t('scan.confidence')}</p>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-border/50">
                   <button 
                     onClick={(e) => handleDownload(e, item)}
                     className="p-2 rounded-lg bg-card border border-gray-border text-subtitle hover:text-white hover:border-subtitle transition-colors"
                     title="Download PDF"
                   >
                     <Download className="w-4 h-4" />
                   </button>
                   <button className="flex-1 flex items-center justify-center gap-2 text-primary font-semibold text-sm hover:text-primary-dark transition-colors">
                     {t('history.viewReport')} <ChevronRight className="w-4 h-4" />
                   </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />
    </div>
  )
}
