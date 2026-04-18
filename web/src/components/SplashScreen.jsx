import { useEffect, useState } from 'react'
import { Microscope } from 'lucide-react'

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('in') // 'in' | 'hold' | 'out'

  useEffect(() => {
    // Phase: fade-in (600ms) → hold (1400ms) → fade-out (500ms)
    const t1 = setTimeout(() => setPhase('out'), 2000)
    const t2 = setTimeout(() => onDone(), 2500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onDone])

  return (
    <div
      className={`fixed inset-0 bg-black z-[9999] flex flex-col items-center justify-center
        transition-opacity duration-500
        ${phase === 'out' ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Pulse rings */}
      <div className="relative flex items-center justify-center mb-8">
        <span className="absolute w-28 h-28 rounded-full border border-primary/30 animate-[pulseRingAnim_2.5s_ease-out_infinite]" />
        <span className="absolute w-28 h-28 rounded-full border border-primary/30 animate-[pulseRingAnim_2.5s_ease-out_1.25s_infinite]" />

        {/* Icon circle */}
        <div className="relative w-20 h-20 rounded-full bg-primary/10 border border-primary/30
                        flex items-center justify-center animate-[float_3.5s_ease-in-out_infinite]">
          <Microscope className="w-9 h-9 text-primary" />
        </div>
      </div>

      {/* AURALYSIS */}
      <h1 className={`text-5xl font-black tracking-[0.25em] text-white uppercase
                       transition-all duration-600
                       ${phase === 'in' ? 'splash-in' : ''}`}>
        AURALYSIS
      </h1>
      <p className="mt-3 text-subtitle text-sm tracking-widest uppercase">
        AI Medical Platform
      </p>
    </div>
  )
}
