import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Mic, MicOff, Volume2, User, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { chat } from '../api/api'
import { useToast } from '../context/ToastContext'

export default function ChatBot({ currentReportContext = "" }) {
  const { t, i18n } = useTranslation()
  const { addToast } = useToast()
  
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', text: t('chat.greeting') }
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  
  const messagesEndRef = useRef(null)
  
  // scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Update greeting if language changes
  useEffect(() => {
    setMessages(prev => {
      const newMsgs = [...prev]
      if (newMsgs.length > 0 && newMsgs[0].role === 'assistant') {
        newMsgs[0].text = t('chat.greeting')
      }
      return newMsgs
    })
  }, [i18n.language, t])

  const handleSend = async () => {
    if (!input.trim()) return
    
    const userMsg = input.trim()
    setInput('')
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: userMsg }])
    setIsLoading(true)
    
    try {
      // Append context if it's the first time asking about a specific report, or pass every time.
      const response = await chat(userMsg, currentReportContext)
      setMessages(prev => [...prev, { role: 'assistant', text: response.response }])
    } catch (err) {
      console.error(err)
      addToast(t('common.error'), 'error')
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm sorry, I encountered an error. Please try again." }])
    } finally {
      setIsLoading(false)
    }
  }

  // --- Voice Input (SpeechRecognition) ---
  const toggleListen = () => {
    if (isListening) {
      stopListen()
    } else {
      startListen()
    }
  }

  const startListen = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      addToast("Speech recognition not supported in your browser.", "warning")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = i18n.language === 'en' ? 'en-US' : 
                       i18n.language === 'hi' ? 'hi-IN' : 
                       i18n.language === 'mr' ? 'mr-IN' :
                       i18n.language === 'ta' ? 'ta-IN' :
                       i18n.language === 'te' ? 'te-IN' :
                       i18n.language === 'bn' ? 'bn-IN' : 'en-US'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput(prev => prev + (prev ? ' ' : '') + transcript)
    }
    
    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error)
      setIsListening(false)
    }
    
    recognition.onend = () => setIsListening(false)
    
    try {
      recognition.start()
    } catch(e) {
      console.error(e)
    }
  }

  const stopListen = () => {
    // Relying on onend to set state. A bit hacky to force stop here.
    setIsListening(false)
  }

  // --- TTS (SpeechSynthesis) ---
  const speakOutput = (text) => {
    if (!window.speechSynthesis) return

    window.speechSynthesis.cancel() // clear queue

    const utterance = new SpeechSynthesisUtterance(text)
    
    // Attempt language matching
    let langCode = 'en-US'
    if (i18n.language === 'hi') langCode = 'hi-IN'
    if (i18n.language === 'mr') langCode = 'mr-IN'
    // ... basic mapping. Browsers might not support all voices
    
    utterance.lang = langCode
    
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-primary rounded-full shadow-2xl flex items-center justify-center text-white hover:bg-primary-dark hover:scale-110 transition-all z-40 group"
        >
          <MessageSquare className="w-8 h-8" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-black"></span>
        </button>
      )}

      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-card border-l border-gray-border shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-border bg-black/40 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center p-2 relative">
                <Microscope className="w-full h-full text-primary" />
             </div>
            <div>
              <h3 className="font-bold text-white leading-tight">{t('chat.title')}</h3>
              <div className="flex items-center gap-1.5 opacity-80">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-xs text-subtitle">{t('chat.online')}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-subtitle hover:text-white transition-colors p-2 rounded-xl hover:bg-gray-border/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-black/20">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} group/msg`}>
              {msg.role === 'assistant' && (
                 <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mr-2 mt-auto text-xs font-bold">AI</div>
              )}
              
              <div className="relative max-w-[80%] flex flex-col gap-1 items-start">
                <div 
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-sm' 
                      : 'bg-[#2A2A2A] text-white rounded-tl-sm border border-gray-border/50'
                  }`}
                >
                  {msg.text}
                </div>
                
                {/* Text to verify actions for bot Msgs */}
                {msg.role === 'assistant' && idx > 0 && (
                   <button 
                     onClick={() => speakOutput(msg.text)}
                     className="text-subtitle hover:text-primary transition-colors flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 pl-2 mt-1"
                   >
                     <Volume2 className="w-3 h-3" />
                     <span className="text-[10px] uppercase font-bold tracking-wider">Listen</span>
                   </button>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mr-2 mt-auto text-xs font-bold">AI</div>
              <div className="bg-[#2A2A2A] px-5 py-4 rounded-2xl rounded-tl-sm border border-gray-border/50 flex gap-1.5 items-center">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Disclaimer footer inside chat */}
         <div className="px-4 py-2 bg-black text-center border-t border-gray-border">
          <p className="text-[10px] text-subtitle leading-tight max-w-[90%] mx-auto">
             {t('chat.disclaimer')}
          </p>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-border bg-card shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 relative bg-black rounded-2xl border border-gray-border p-1 focus-within:border-primary/50 transition-colors"
          >
            <button
              type="button"
              onClick={toggleListen}
              className={`p-3 rounded-xl transition-colors shrink-0 ${isListening ? 'bg-red-900/40 text-red-400' : 'text-subtitle hover:text-white hover:bg-[#2A2A2A]'}`}
            >
              {isListening ? <MicOff className="w-5 h-5 animate-pulse" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening..." : t('chat.placeholder')}
              className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none focus:ring-0 px-2"
              disabled={isLoading || isListening}
            />
            
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-3 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:bg-gray-border disabled:text-subtitle shrink-0"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      </div>
      
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

function Microscope(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 18h8"></path><path d="M3 22h18"></path><path d="M14 22a7 7 0 1 0 0-14h-1"></path><path d="M9 14h2"></path><path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z"></path><path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3"></path>
    </svg>
  )
}
