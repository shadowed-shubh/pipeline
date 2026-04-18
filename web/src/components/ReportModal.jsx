import { X, ShieldAlert, Download } from 'lucide-react'
import { generatePDF } from '../utils/pdf'

export default function ReportModal({ report, onClose }) {
  if (!report) return null

  const handleDownload = () => {
    generatePDF(report.patientName || 'Patient', report)
  }

  // Parse report_summary if it's a string (from history)
  let data = {}
  if (typeof report.report_summary === 'string') {
    try {
      data = JSON.parse(report.report_summary)
    } catch {
      data = {}
    }
  } else {
    data = report.report_summary || report.medical_report || {}
  }

  // Extract components
  const severity = data.severity_level || (report.confidence > 0.8 ? 'high' : report.confidence > 0.5 ? 'moderate' : 'low')
  const explanation = data.medical_explanation || 'No detailed explanation available.'
  const symptoms = data.possible_symptoms || []
  const steps = data.recommended_next_steps || []
  const specialist = data.specialist_to_consult || 'General Physician'
  const emergency = data.emergency_signs_to_watch || 'None specified.'
  
  // Badge color mapping
  const severityColor = {
    low: 'badge-green',
    moderate: 'badge-orange',
    high: 'badge-red',
    critical: 'badge-red'
  }[severity.toLowerCase()] || 'badge-blue'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm slide-in-right">
      <div className="bg-card w-full max-w-3xl max-h-[90vh] rounded-2xl border border-gray-border flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-border shrink-0 bg-black/40">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{report.disease || 'Scan Report'}</h2>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${severityColor}`}>
                {severity} Risk
              </span>
              <span className="text-sm font-medium text-primary bg-primary-pale px-3 py-1 rounded-full">
                {((report.confidence || 0) * 100).toFixed(1)}% Confidence
              </span>
            </div>
          </div>
          <div className="flex gap-3">
             <button onClick={handleDownload} className="w-10 h-10 rounded-full bg-card border border-gray-border flex items-center justify-center text-subtitle hover:text-primary hover:border-primary transition-colors">
              <Download className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-card border border-gray-border flex items-center justify-center text-subtitle hover:text-red-400 hover:border-red-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-8 flex-1 custom-scrollbar">
          
          <div className="space-y-2">
            <h3 className="section-title">Medical Explanation</h3>
            <p className="text-white text-sm leading-relaxed bg-black/20 p-4 rounded-xl border border-gray-border/50">
              {explanation}
            </p>
          </div>

          {symptoms.length > 0 && (
            <div className="space-y-3">
              <h3 className="section-title">Possible Symptoms</h3>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((sym, i) => (
                  <span key={i} className="bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg text-sm">
                    {sym}
                  </span>
                ))}
              </div>
            </div>
          )}

          {steps.length > 0 && (
            <div className="space-y-3">
              <h3 className="section-title">Recommended Next Steps</h3>
              <div className="space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-3 bg-black/20 p-3 rounded-xl border border-gray-border/50">
                    <span className="text-primary font-bold">{i + 1}.</span>
                    <span className="text-sm text-white/90">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h3 className="section-title">Specialist to Consult</h3>
            <div className="inline-block bg-primary/10 border border-primary/20 text-primary font-semibold px-4 py-2 rounded-xl text-sm">
              {specialist}
            </div>
          </div>

          {emergency && emergency !== 'None specified.' && (
            <div className="bg-red-900/20 border border-red-900/50 p-4 rounded-xl flex gap-3 items-start">
              <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-red-500 font-semibold text-sm mb-1 uppercase tracking-wider">Emergency Signs to Watch</h3>
                <p className="text-red-200/80 text-sm leading-relaxed">{emergency}</p>
              </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="p-4 bg-black/40 border-t border-gray-border shrink-0">
          <p className="text-xs text-subtitle text-center italic">
            Disclaimer: This AI analysis is for informational purposes only and does not constitute professional medical advice. Please consult a doctor for official diagnosis and treatment.
          </p>
        </div>
      </div>
    </div>
  )
}
