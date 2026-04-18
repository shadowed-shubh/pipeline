import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CloudUpload, RefreshCcw, FileText, CheckCircle, Save, Download, Volume2, Loader2, ShieldAlert, ChevronDown } from 'lucide-react'
import { diagnose, addHistory } from '../../api/mock'
import { useToast } from '../../context/ToastContext'
import { generatePDF } from '../../utils/pdf'
import { useAuth } from '../../context/AuthContext'
import ChatBot from '../../components/ChatBot'

export default function ScanPage() {
  const { t } = useTranslation()
  const { addToast } = useToast()
  const { user } = useAuth()
  
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  
  const [status, setStatus] = useState('idle') // idle, uploading, generating, result
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(false)
  
  const [audioUrl, setAudioUrl] = useState(null)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef(new Audio())

  // --- Drag & Drop ---
  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation() }
  const handleDragIn = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true) }
  const handleDragOut = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false) }
  
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (f) => {
    const valid = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!valid.includes(f.type)) return addToast("File type not supported", "error")
    if (f.size > 25 * 1024 * 1024) return addToast("File exceeds 25MB", "error")

    setFile(f)
    setResult(null)
    setSaved(false)
    setExpanded(false)

    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => setPreview(e.target.result)
      reader.readAsDataURL(f)
    } else {
      setPreview(null) // PDF fallback
    }
  }

  // --- API ---
  const doAnalyse = async () => {
    if (!file) return
    setStatus('uploading')
    
    // Simulate generation phases
    const p2 = setTimeout(() => setStatus('generating'), 2000)
    
    try {
      const res = await diagnose(file) // returns { prediction, confidence, medical_report, voice_report_url }
      clearTimeout(p2)
      setResult(res)
      if (res.voice_report_url) setAudioUrl(res.voice_report_url)
      setStatus('result')
    } catch (err) {
      clearTimeout(p2)
      addToast(t('common.error'), "error")
      setStatus('idle')
    }
  }

  const handleSave = async () => {
    if (!result || saved) return
    try {
      const payload = {
        disease: result.prediction,
        confidence: result.confidence,
        report_summary: typeof result.medical_report === 'string' ? result.medical_report : JSON.stringify(result.medical_report || {}),
        voice_url: result.voice_report_url || ""
      }
      await addHistory(payload)
      setSaved(true)
      addToast(t('scan.saved'))
    } catch (err) {
      addToast(t('common.error'), 'error')
    }
  }

  const handleDownload = () => {
    if (!result) return
    generatePDF(user?.name || 'Patient', result)
  }

  const handleVoice = () => {
    if (!audioUrl) return addToast("No voice report available", "warning")
    
    // If external URL returned by backend:
    if (audioUrl.startsWith('http')) {
       if (playing) { audioRef.current.pause(); setPlaying(false); return }
       if (audioRef.current.src !== audioUrl) audioRef.current.src = audioUrl
       audioRef.current.play().then(() => setPlaying(true))
       audioRef.current.onended = () => setPlaying(false)
    }
  }

  // --- Result parsing ---
  const med = typeof result?.medical_report === 'string' 
    ? (()=>{ try{return JSON.parse(result.medical_report)}catch{return {}} })() 
    : (result?.medical_report || {})

  const severity = med.severity_level || (result?.confidence > 0.8 ? 'high' : result?.confidence > 0.5 ? 'moderate' : 'low')
  const sevColor = severity.toLowerCase() === 'high' ? 'badge-red' : severity.toLowerCase() === 'moderate' ? 'badge-orange' : 'badge-green'

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-10 fade-in">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-widest">{t('scan.title')}</h1>
        <p className="text-subtitle mt-2">{t('scan.subtitle')}</p>
      </div>

      <div className="card p-6 md:p-10 border border-gray-border shadow-2xl relative overflow-hidden bg-black/40 backdrop-blur-md">
        
        {/* State: Idle / File Selected */}
        {(status === 'idle' || status === 'uploading' || status === 'generating') && (
          <div className="space-y-6">
            {!file ? (
              <label 
                onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 min-h-[300px] bg-black/50
                  ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-border hover:border-subtitle'}`}
              >
                <div className="w-20 h-20 rounded-full bg-card shadow-lg flex items-center justify-center border border-gray-border mb-6">
                  <CloudUpload className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{t('scan.dropHint')}</h3>
                <p className="text-primary font-medium tracking-wide mb-6 uppercase text-sm">{t('scan.orClick')}</p>
                <p className="text-subtitle text-sm bg-card px-4 py-2 rounded-xl inline-block border border-gray-border/50">{t('scan.supported')}</p>
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => handleFile(e.target.files[0])} />
              </label>
            ) : (
              <div className="border border-gray-border rounded-3xl p-6 bg-black/50">
                <div className="flex flex-col sm:flex-row gap-6 items-center">
                  
                  {preview ? (
                     <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 border border-gray-border bg-black">
                       <img src={preview} alt="preview" className="w-full h-full object-cover" />
                     </div>
                  ) : (
                     <div className="w-32 h-32 rounded-2xl flex items-center justify-center shrink-0 border border-gray-border bg-black">
                       <FileText className="w-10 h-10 text-primary" />
                     </div>
                  )}
                  
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-white font-semibold truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                    <p className="text-subtitle text-sm mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    
                    {status === 'idle' && (
                      <div className="flex gap-3 mt-6 justify-center sm:justify-start">
                        <label className="btn-outline cursor-pointer py-2 px-4 shadow-xl bg-black">
                          {t('scan.changeFile')}
                          <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => handleFile(e.target.files[0])} />
                        </label>
                        <button onClick={doAnalyse} className="btn-primary py-2 px-8 shadow-xl shadow-primary/20">
                           {t('scan.analyseBtn')}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Loading state injects here */}
                {status !== 'idle' && (
                  <div className="mt-8 pt-8 border-t border-gray-border">
                    <div className="flex items-center gap-4 mb-3">
                       <Loader2 className="w-6 h-6 text-primary animate-spin shrink-0" />
                       <p className="text-white font-medium">
                         {status === 'uploading' ? t('scan.uploading') : t('scan.generating')}
                       </p>
                    </div>
                    <div className="h-2 w-full bg-black rounded-full overflow-hidden border border-gray-border">
                        <div className={`h-full bg-primary relative ${status === 'uploading' ? 'w-1/3' : 'w-2/3'}`}>
                             <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* State: Result */}
        {status === 'result' && result && (
          <div className="fade-in space-y-6">
            
            {/* Header Badge Row */}
            <div className="flex items-start justify-between flex-wrap gap-4 pb-6 border-b border-gray-border">
               <div>
                  <p className="text-subtitle text-sm font-semibold uppercase tracking-widest leading-none mb-2">{t('scan.diagnosis')}</p>
                  <h2 className="text-3xl font-black text-white">{result.prediction}</h2>
               </div>
               <div className="flex gap-2">
                  <div className="flex flex-col items-end">
                    <span className="text-subtitle text-[10px] uppercase font-bold tracking-widest">{t('scan.confidence')}</span>
                    <span className="badge-blue text-sm">{(result.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-subtitle text-[10px] uppercase font-bold tracking-widest">{t('scan.severity')}</span>
                    <span className={`${sevColor} text-sm uppercase`}>{severity}</span>
                  </div>
               </div>
            </div>

            {/* AI Summary */}
            <div>
              <h3 className="section-title mb-3">{t('scan.aiSummary')}</h3>
              <p className="text-white bg-black/30 p-5 rounded-2xl border border-gray-border/50 leading-relaxed text-sm">
                 {med.medical_explanation || "No explanation provided by AI."}
              </p>
            </div>

            {/* Expandable Report */}
            <div className="border border-gray-border rounded-2xl overflow-hidden bg-black/20">
               <button 
                 onClick={() => setExpanded(!expanded)} 
                 className="w-full flex items-center justify-between p-4 bg-card/40 hover:bg-card/80 transition-colors"
               >
                 <span className="font-bold text-white tracking-wide uppercase text-sm">{t('scan.fullReport')}</span>
                 <ChevronDown className={`w-5 h-5 text-primary transition-transform ${expanded ? 'rotate-180' : ''}`} />
               </button>
               
               {expanded && (
                 <div className="p-5 border-t border-gray-border space-y-6 bg-black/40 report-expand">
                    
                    {med.possible_symptoms && med.possible_symptoms.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-subtitle uppercase tracking-widest mb-2">{t('scan.symptoms')}</h4>
                        <div className="flex flex-wrap gap-2">
                          {med.possible_symptoms.map((s, i) => (
                            <span key={i} className="bg-primary/10 border border-primary/20 text-primary px-3 py-1 text-xs rounded-md">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {med.recommended_next_steps && med.recommended_next_steps.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-subtitle uppercase tracking-widest mb-2">{t('scan.nextSteps')}</h4>
                        <ol className="space-y-2">
                          {med.recommended_next_steps.map((s, i) => (
                            <li key={i} className="flex gap-3 text-sm text-white/90 bg-black/20 p-2 rounded-lg border border-gray-border/30">
                              <span className="text-primary font-black shrink-0">{i + 1}.</span> {s}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    <div className="flex justify-between items-center bg-primary/5 p-4 border border-primary/10 rounded-xl">
                       <span className="text-xs font-bold text-subtitle uppercase tracking-widest">{t('scan.specialist')}</span>
                       <span className="font-bold text-primary">{med.specialist_to_consult || 'General Physician'}</span>
                    </div>

                    {med.emergency_signs_to_watch && med.emergency_signs_to_watch !== "None specified." && (
                       <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl flex gap-3">
                         <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                         <div>
                            <h4 className="text-red-500 text-xs font-bold uppercase tracking-widest mb-1">{t('scan.emergency')}</h4>
                            <p className="text-red-200/80 text-sm leading-relaxed">{med.emergency_signs_to_watch}</p>
                         </div>
                       </div>
                    )}
                 </div>
               )}
            </div>

            {/* Action Buttons Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-6 border-t border-gray-border">
              {audioUrl && (
                <button onClick={handleVoice} className="btn-outline py-2.5 px-4 text-sm font-medium w-full shadow-lg bg-black truncate">
                  <Volume2 className={`w-4 h-4 shrink-0 ${playing ? 'text-primary animate-pulse' : ''}`} />
                  {playing ? t('scan.playing') : t('scan.playVoice')}
                </button>
              )}
              
              <button onClick={handleDownload} className="btn-outline py-2.5 px-4 text-sm font-medium w-full shadow-lg bg-black truncate text-white border-gray-border hover:border-primary">
                <Download className="w-4 h-4 shrink-0" /> {t('scan.downloadPdf')}
              </button>

              <button 
                onClick={handleSave} 
                disabled={saved}
                className={`btn-outline py-2.5 px-4 text-sm font-medium w-full shadow-lg bg-black truncate ${saved ? 'border-green-500/50 text-green-400 bg-green-900/10 cursor-default hover:bg-green-900/10 hover:text-green-400' : ''}`}
              >
                {saved ? <CheckCircle className="w-4 h-4 shrink-0"/> : <Save className="w-4 h-4 shrink-0"/>}
                {saved ? t('scan.saved') : t('scan.saveHistory')}
              </button>

              <button onClick={() => {setResult(null); setFile(null); setStatus('idle')}} className="btn-primary py-2.5 px-4 text-sm font-medium w-full shadow-lg shadow-primary/20 truncate sm:col-span-2 lg:col-span-1">
                <RefreshCcw className="w-4 h-4 shrink-0" /> {t('scan.newScan')}
              </button>
            </div>
            
            <p className="text-center text-[10px] text-subtitle mt-4 italic max-w-xl mx-auto">{t('scan.disclaimer')}</p>

          </div>
        )}
      </div>
      
      {/* Invisible chat context injector - if chatbot is open it will read this context automatically via props on layout level usually, but we inject implicitly by passing report string to ChatBot. We render a scoped ChatBot here just to pass context, or use a global store. In this app, ChatBot is global, but we can render it here too, React will diff and keep the portal or use Context.  Actually, ChatBot is in AppLayout. We can use a Context for this. For simplicity we'll just let the chatbot send the current screen context if it's open.
          Let's render a hidden ChatBot with props, it will override the global one if we manage state, OR we leave it. Wait, ChatBot is in AppLayout. To pass context, we just stringify the result. 
      */}
      {status === 'result' && result && (
        <ChatBot currentReportContext={JSON.stringify(result)} /> 
      )}
    </div>
  )
}
