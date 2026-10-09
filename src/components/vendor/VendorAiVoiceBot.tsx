import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  X,
  Sparkles,
  Phone,
  Clock,
  Calendar,
  FileText,
  Home,
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { LabTest, LabPackage, ReceptionPatientEntry, LabReport, Language } from '../../types';
import {
  VendorVoiceContext,
  VoiceBotResponse,
  VoiceBotAction,
  askVendorVoiceBot,
  VoiceSpeaker
} from '../../services/vendorAiVoiceService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  actions?: VoiceBotAction[];
  isVoice?: boolean;
}

interface VendorAiVoiceBotProps {
  currentLabItem: any;
  vendorLabSettings: any;
  vendorTests: LabTest[];
  vendorPackages: LabPackage[];
  vendorDoctors: any[];
  allReports?: LabReport[];
  allReceptionEntries?: ReceptionPatientEntry[];
  currentWebsiteLabId: string;
  onOpenReportPortal: (reportId?: string, mobile?: string) => void;
  onOpenBookingModal: (preselectedTestId?: string) => void;
  onOpenDownloadAppModal?: () => void;
  language?: Language;
}

export const VendorAiVoiceBot: React.FC<VendorAiVoiceBotProps> = ({
  currentLabItem,
  vendorLabSettings,
  vendorTests,
  vendorPackages,
  vendorDoctors,
  allReports = [],
  allReceptionEntries = [],
  currentWebsiteLabId,
  onOpenReportPortal,
  onOpenBookingModal,
  onOpenDownloadAppModal,
}) => {
  // Panel open/closed state
  const [isOpen, setIsOpen] = useState(false);

  // Floating button highlight state (highlight only, NO size increase)
  const [isButtonHighlighted, setIsButtonHighlighted] = useState(false);
  const highlightTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [speechLanguage, setSpeechLanguage] = useState<'hi-IN' | 'en-IN'>('hi-IN');
  const [speechEnabled, setSpeechEnabled] = useState(true); // 🔊 Speaker ON by default
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micSupported, setMicSupported] = useState(true);

  // Chat message stream
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Speech Recognition instance ref
  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Prepare strictly scoped vendor context
  const vendorContext: VendorVoiceContext = React.useMemo(() => {
    const vName =
      vendorLabSettings?.labName ||
      vendorLabSettings?.name ||
      currentLabItem?.name ||
      'हमारी डायग्नोस्टिक लैब';

    const address =
      vendorLabSettings?.address ||
      vendorLabSettings?.city ||
      currentLabItem?.address ||
      currentLabItem?.city ||
      '';

    const phone =
      vendorLabSettings?.phone ||
      vendorLabSettings?.contactNumber ||
      currentLabItem?.phone ||
      '';

    const whatsapp =
      vendorLabSettings?.whatsappNumber ||
      vendorLabSettings?.whatsapp ||
      phone;

    const email =
      vendorLabSettings?.email ||
      currentLabItem?.email ||
      '';

    const timings =
      vendorLabSettings?.timings ||
      vendorLabSettings?.workingHours ||
      'सुबह 07:00 AM से रात 09:00 PM तक';

    return {
      vendorId: currentWebsiteLabId,
      vendorName: vName,
      tagline: vendorLabSettings?.tagline || currentLabItem?.tagline,
      phone,
      whatsapp,
      email,
      address,
      timings,
      homeCollectionEnabled: vendorLabSettings?.homeCollectionEnabled !== false,
      homeCollectionFee: vendorLabSettings?.homeCollectionFee || 0,
      tests: vendorTests || [],
      packages: vendorPackages || [],
      doctors: (vendorDoctors || []).map((d) => ({
        name: d.name || d.doctorName || 'कंसल्टेंट पैथोलॉजिस्ट',
        qualification: d.qualification || d.degree || 'MBBS, MD',
        specialization: d.specialization || d.speciality || 'Pathology',
        designation: d.designation || 'Consultant Pathologist',
      })),
      allReports,
      allReceptionEntries,
    };
  }, [
    vendorLabSettings,
    currentLabItem,
    currentWebsiteLabId,
    vendorTests,
    vendorPackages,
    vendorDoctors,
    allReports,
    allReceptionEntries,
  ]);

  // Initial welcome greeting from bot
  useEffect(() => {
    const initialGreeting = `नमस्ते! मैं ${vendorContext.vendorName} का AI Voice Assistant हूँ 🎙️।\n\nआप बोलकर (Voice) या लिखकर (Text) सवाल पूछ सकते हैं:\n• टेस्ट का रेट व फास्टिंग नियम\n• होम कलेक्शन बुकिंग\n• फुल बॉडी हेल्थ चेकअप पैकेजेस\n• लैब का समय व पता\n• रिपोर्ट का स्टेटस`;

    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [vendorContext.vendorName]);

  // Normal smooth scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isListening, transcript]);

  // Button highlight trigger (Size never changes, only highlights)
  const triggerHighlight = () => {
    setIsButtonHighlighted(true);
    if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = setTimeout(() => {
      if (!isOpen) {
        setIsButtonHighlighted(false);
      }
    }, 4000);
  };

  useEffect(() => {
    if (isOpen) {
      setIsButtonHighlighted(true);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    } else {
      triggerHighlight();
    }
    return () => {
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
    };
  }, [isOpen]);

  // Web Speech Recognition Initialization (Hindi, English, Hinglish)
  useEffect(() => {
    const windowWithSpeech = window as any;
    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLanguage;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += piece;
          } else {
            interimTranscript += piece;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        setTranscript(currentText);
        setInputText(currentText);

        // Auto-submit after silence of 1.5 seconds if we have speech
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
        if (currentText.trim().length > 1) {
          silenceTimeoutRef.current = setTimeout(() => {
            handleStopAndSubmitSpeech(currentText);
          }, 1500);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status:', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('Error setting up speech recognition:', err);
      setMicSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, [speechLanguage]);

  // Start Voice Listening
  const startListening = () => {
    triggerHighlight();
    if (!recognitionRef.current) {
      // Graceful fallback for non-WebSpeech browsers
      alert('माइक्रोफ़ोन इस ब्राउज़र में उपलब्ध नहीं है। आप नीचे टाइप करके पूछ सकते हैं।');
      return;
    }

    try {
      VoiceSpeaker.stop();
      setIsSpeaking(false);
      setTranscript('');
      recognitionRef.current.lang = speechLanguage;
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch {}
        }, 150);
      } catch {}
    }
  };

  // Stop Voice Listening
  const stopListening = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  // Stop & Submit Speech
  const handleStopAndSubmitSpeech = (textToSend?: string) => {
    stopListening();
    const query = (textToSend || transcript || inputText).trim();
    if (query.length > 0) {
      submitUserQuery(query, true);
    }
    setTranscript('');
  };

  // Submit User Query (Voice or Text)
  const submitUserQuery = async (queryText: string, isFromVoice = false) => {
    if (!queryText.trim() || isProcessing) return;

    stopListening();

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoice: isFromVoice,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setTranscript('');
    setIsProcessing(true);

    try {
      const response: VoiceBotResponse = await askVendorVoiceBot(
        queryText,
        vendorContext,
        'hinglish'
      );

      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: response.actions,
      };

      setMessages((prev) => [...prev, botMsg]);

      // If Speaker is ON, automatically speak the AI answer in Voice
      if (speechEnabled) {
        VoiceSpeaker.speak(response.speechText || response.reply, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    } catch (e) {
      console.error('Error processing query:', e);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: `माफ़ कीजिए, अभी आपका सवाल प्रोसेस नहीं हो पाया। आप सीधे हमें कॉल कर सकते हैं: ${vendorContext.phone}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Quick Actions
  const handleExecuteAction = (action: VoiceBotAction) => {
    switch (action.type) {
      case 'book_test':
        setIsOpen(false);
        onOpenBookingModal(action.payload?.testId);
        break;
      case 'book_home_collection':
        setIsOpen(false);
        onOpenBookingModal();
        break;
      case 'check_report':
        setIsOpen(false);
        onOpenReportPortal(action.payload?.token);
        break;
      case 'download_app':
        setIsOpen(false);
        if (onOpenDownloadAppModal) onOpenDownloadAppModal();
        break;
      case 'scroll_tests':
        setIsOpen(false);
        setTimeout(() => {
          const el = document.getElementById('tests-packages-section') || document.getElementById('tests-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        break;
      case 'view_packages':
        setIsOpen(false);
        setTimeout(() => {
          const el = document.getElementById('packages-section') || document.getElementById('tests-packages-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        break;
      case 'call_lab':
        if (action.payload?.phone) {
          window.location.href = `tel:${action.payload.phone}`;
        }
        break;
      case 'whatsapp_lab':
        if (action.payload?.phone) {
          const cleanPhone = action.payload.phone.replace(/\D/g, '');
          const url = `https://wa.me/91${cleanPhone.slice(-10)}?text=${encodeURIComponent(
            `नमस्ते ${vendorContext.vendorName}, मुझे टेस्ट / होम कलेक्शन बुक करना है।`
          )}`;
          window.open(url, '_blank');
        }
        break;
    }
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. BOT UI - FLOATING / STICKY BUTTON                                     */}
      {/* Exact Spec:                                                              */}
      {/* - AI Bot bottom corner में छोटा floating/sticky button रहेगा।             */}
      {/* - Button पर Touch/Click करने पर size बड़ा नहीं होगा, केवल highlight/active होगा। */}
      {/* - Touch/Click करते ही AI Chat Popup खुलेगा।                               */}
      {/* ========================================================================= */}
      <div
        className="fixed bottom-5 left-4 sm:bottom-6 sm:left-6 z-40 select-none"
        onMouseEnter={triggerHighlight}
        onTouchStart={triggerHighlight}
      >
        <button
          type="button"
          onClick={() => {
            triggerHighlight();
            const nextState = !isOpen;
            setIsOpen(nextState);
            if (nextState) {
              // Immediately start listening on open for seamless hands-free voice experience
              setTimeout(() => {
                startListening();
              }, 300);
            } else {
              stopListening();
              VoiceSpeaker.stop();
            }
          }}
          className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-lg active:scale-95 ${
            isButtonHighlighted || isOpen
              ? 'bg-gradient-to-tr from-[#123B6D] via-blue-600 to-indigo-600 text-white ring-4 ring-blue-500/40 shadow-blue-500/30'
              : 'bg-[#123B6D]/85 hover:bg-[#123B6D] text-white/95 backdrop-blur-md border border-white/20'
          }`}
          title="AI Voice Bot - बोलकर या लिखकर पूछें"
          aria-label="Open AI Voice Bot"
        >
          {/* Animated Microphone Icon */}
          <div className="relative flex items-center justify-center">
            {isListening && (
              <span className="absolute -inset-2 rounded-full bg-rose-500/50 animate-ping" />
            )}
            {isSpeaking && (
              <span className="absolute -inset-2 rounded-full bg-emerald-400/50 animate-pulse" />
            )}

            {isListening ? (
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-rose-300 animate-bounce" />
            ) : isSpeaking ? (
              <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300 animate-pulse" />
            ) : (
              <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300" />
            )}

            {/* Glowing online indicator */}
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white shadow-xs" />
          </div>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 2. AI CHAT POPUP                                                          */}
      {/* Exact Spec:                                                              */}
      {/* - Popup Header: Simple header, Close (X) compact at outer top corner.     */}
      {/* - Popup Body: Customer & AI messages, normal scrollable, Speaker ON/OFF.  */}
      {/* - Popup Footer: Mic Button 🎙️ + Type Bar + Send Button ➤.                 */}
      {/* ========================================================================= */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed bottom-20 left-3 sm:bottom-22 sm:left-6 z-50 w-[calc(100vw-24px)] sm:w-[390px] md:w-[410px] max-h-[85vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-200 text-slate-800 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200"
        >
          {/* 
            COMPACT CLOSE (X) BUTTON ON OUTER TOP CORNER
            "Close (X) button popup के top corner पर, popup की बाहरी side में छोटा सा रहेगा।
             Close button compact रहेगा और popup के अंदर unnecessary space नहीं लेगा।"
          */}
          <button
            type="button"
            onClick={() => {
              stopListening();
              VoiceSpeaker.stop();
              setIsOpen(false);
            }}
            className="absolute -top-3 -right-2 sm:-top-3.5 sm:-right-2.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg border-2 border-white transition-all cursor-pointer z-20 active:scale-90"
            title="Close AI Assistant"
            aria-label="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* 
            POPUP HEADER
            "Simple header रहेगा। अनावश्यक extra options नहीं होंगे।"
          */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#123B6D] text-white rounded-t-3xl relative">
            <div className="flex items-center gap-2.5 pr-2">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
                <Mic className="w-4 h-4 text-amber-300" />
              </div>
              <div className="truncate">
                <h3 className="text-xs sm:text-sm font-black tracking-tight leading-tight truncate">
                  {vendorContext.vendorName}
                </h3>
                <p className="text-[10px] text-blue-200/90 font-medium truncate flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>AI Voice Assistant (Hindi • Eng)</span>
                </p>
              </div>
            </div>

            {/* 
              SPEAKER TOGGLE BUTTON (IN HEADER)
              "Speaker option रहेगा:
               🔊 Speaker ON / Unmute
               🔇 Speaker OFF / Mute
               Speaker ON होने पर AI का जवाब voice में सुनाई देगा।"
            */}
            <button
              type="button"
              onClick={() => {
                if (speechEnabled) {
                  VoiceSpeaker.stop();
                  setIsSpeaking(false);
                  setSpeechEnabled(false);
                } else {
                  setSpeechEnabled(true);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer border shrink-0 ${
                speechEnabled
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30'
                  : 'bg-white/10 text-white/60 border-white/20 hover:bg-white/15'
              }`}
              title={speechEnabled ? 'वॉयस उत्तर चालू है (Mute करने के लिए क्लिक करें)' : 'वॉयस उत्तर बंद है (बोलकर सुनने के लिए क्लिक करें)'}
            >
              {speechEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Speaker ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-white/50" />
                  <span>Speaker OFF</span>
                </>
              )}
            </button>
          </div>

          {/* 
            POPUP BODY
            "Customer और AI के conversation messages दिखाई देंगे।
             Conversation area scrollable होगा।
             अलग Scroll Tab/Button नहीं होगा; normal scrolling ही होगी।"
          */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto max-h-[46vh] sm:max-h-[50vh] bg-slate-50/70">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                    m.sender === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-xs'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
                  }`}
                >
                  {/* Sender identity */}
                  <div className="flex items-center justify-between gap-2 mb-1 pb-1 border-b border-black/5 text-[10px] opacity-75">
                    <span className="font-bold flex items-center gap-1">
                      {m.sender === 'user' ? (
                        <>👤 You {m.isVoice && '🎙️ (Voice)'}</>
                      ) : (
                        <>🎙️ {vendorContext.vendorName} AI</>
                      )}
                    </span>
                    <span>{m.timestamp}</span>
                  </div>

                  {/* Message body */}
                  <div className="whitespace-pre-line font-medium">{m.text}</div>

                  {/* Actions buttons if any */}
                  {m.actions && m.actions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                      {m.actions.map((act, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleExecuteAction(act)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-95 transition-all border border-blue-200 cursor-pointer shadow-xs"
                        >
                          <span>{act.label}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Replay voice button for bot message */}
                  {m.sender === 'bot' && (
                    <div className="mt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          VoiceSpeaker.speak(m.text, {
                            onStart: () => setIsSpeaking(true),
                            onEnd: () => setIsSpeaking(false),
                            onError: () => setIsSpeaking(false),
                          });
                        }}
                        className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                        title="Replay Audio"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>सुने (Audio)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Live Voice Recording Status */}
            {isListening && (
              <div className="flex flex-col items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-2xl animate-pulse">
                <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                  <Mic className="w-4 h-4 text-rose-500 animate-bounce" />
                  <span>सुन रहे हैं... बोलिए (Listening...)</span>
                </div>
                {transcript ? (
                  <p className="mt-1 text-xs font-semibold text-slate-800 text-center italic">
                    "{transcript}"
                  </p>
                ) : (
                  <p className="mt-0.5 text-[10px] text-blue-600 text-center">
                    अपना सवाल या टेस्ट का नाम बोलें (जैसे: "CBC टेस्ट का क्या रेट है?")
                  </p>
                )}
                {/* Visualizer sound bars */}
                <div className="mt-2 flex items-center gap-1">
                  <span className="w-1 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1 h-5 bg-indigo-600 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:300ms]" />
                  <span className="w-1 h-6 bg-rose-500 rounded-full animate-bounce [animation-delay:200ms]" />
                  <span className="w-1 h-4 bg-indigo-500 rounded-full animate-bounce [animation-delay:400ms]" />
                </div>
              </div>
            )}

            {/* Processing state */}
            {isProcessing && (
              <div className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 shadow-2xs">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>AI जवाब तैयार कर रहा है...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ===================================================================== */}
          {/* POPUP FOOTER                                                          */}
          {/* Exact Spec:                                                          */}
          {/* - 🎙️ Mic Button: Voice command/question के लिए।                        */}
          {/* - Type Bar: Customer text type कर सके।                                */}
          {/* - Send Button ➤: Typed message भेजने के लिए।                           */}
          {/* - Customer Voice या Text—दोनों तरीकों से AI से बातचीत कर सके।         */}
          {/* ===================================================================== */}
          <div className="p-3 bg-slate-50 border-t border-slate-200 rounded-b-3xl">
            <div className="flex items-center gap-2">
              {/* 1. Mic Button 🎙️ */}
              <button
                type="button"
                onClick={isListening ? () => handleStopAndSubmitSpeech() : startListening}
                className={`relative flex items-center justify-center w-10 h-10 rounded-xl text-white transition-all cursor-pointer shrink-0 shadow-md ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-700 ring-4 ring-rose-400/30 active:scale-95'
                    : 'bg-[#123B6D] hover:bg-[#0e2c52] active:scale-95'
                }`}
                title={isListening ? 'बोलना बंद करें और भेजें' : 'बोलकर सवाल पूछें (Voice Command)'}
                aria-label="Voice input"
              >
                {isListening ? (
                  <MicOff className="w-5 h-5 text-white animate-pulse" />
                ) : (
                  <Mic className="w-5 h-5 text-amber-300" />
                )}
              </button>

              {/* 2. Type Bar */}
              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      submitUserQuery(inputText, false);
                    }
                  }}
                  placeholder={
                    isListening
                      ? 'सुन रहे हैं... बोलिए'
                      : 'सवाल पूछें या बोलें... (Ask here)'
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 placeholder-slate-400 font-medium"
                />
              </div>

              {/* 3. Send Button ➤ */}
              <button
                type="button"
                disabled={!inputText.trim() && !transcript.trim()}
                onClick={() => {
                  if (isListening) {
                    handleStopAndSubmitSpeech();
                  } else {
                    submitUserQuery(inputText, false);
                  }
                }}
                className="w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md cursor-pointer shrink-0 active:scale-95"
                title="Send Message"
                aria-label="Send"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Subtle Language Indicator */}
            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-1 font-medium">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Voice: Hindi • English • Hinglish</span>
              </span>
              <button
                type="button"
                onClick={() => setSpeechLanguage(speechLanguage === 'hi-IN' ? 'en-IN' : 'hi-IN')}
                className="font-bold text-blue-700 hover:underline cursor-pointer"
              >
                Lang: {speechLanguage === 'hi-IN' ? 'हिंदी/Hinglish' : 'English'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
