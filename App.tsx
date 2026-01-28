
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Volume2, ShieldAlert, Activity, Info, LogIn, Skull, AlertOctagon, Car, BookOpen, Save, MessageSquareText, VolumeX } from 'lucide-react';
import { AppState, ObservationResult, SavedObservation } from './types';
import { GeminiService } from './services/geminiService';
import CameraView from './components/CameraView';
import ObservationPanel from './components/ObservationPanel';
import HUDOverlay from './components/HUDOverlay';
import HistoryModal from './components/HistoryModal';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [observation, setObservation] = useState<ObservationResult | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCommentaryEnabled, setIsCommentaryEnabled] = useState(true);
  const [hasApiKeySelected, setHasApiKeySelected] = useState(false);
  const [isHazardMode, setIsHazardMode] = useState(false);
  const [motionIntensity, setMotionIntensity] = useState(0);
  
  const [savedObservations, setSavedObservations] = useState<SavedObservation[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const geminiRef = useRef<GeminiService>(new GeminiService());

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem('bandit_logs');
    if (saved) {
      try {
        setSavedObservations(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history when it changes
  useEffect(() => {
    localStorage.setItem('bandit_logs', JSON.stringify(savedObservations));
  }, [savedObservations]);

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window.aistudio !== 'undefined') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKeySelected(hasKey);
      } else {
        setHasApiKeySelected(true);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (typeof window.aistudio !== 'undefined') {
      await window.aistudio.openSelectKey();
      setHasApiKeySelected(true);
    }
  };

  const captureFrame = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      }
    }
    return null;
  }, []);

  const runObservationCycle = useCallback(async () => {
    if (appState === AppState.ANALYZING) return;
    
    setAppState(AppState.ANALYZING);
    const base64Image = captureFrame();
    
    if (!base64Image) {
      setErrorMessage("Lens blocked by literal garbage. Retrying.");
      setAppState(isHazardMode ? AppState.HAZARD : AppState.OBSERVING);
      return;
    }

    setCurrentImage(base64Image);

    try {
      const result = await geminiRef.current.analyzeHuman(base64Image, isHazardMode);
      setObservation(result);
      
      if (isCommentaryEnabled && !isMuted) {
        await geminiRef.current.speakCommentary(result.commentary, isHazardMode);
      }
      
      setAppState(isHazardMode ? AppState.HAZARD : AppState.OBSERVING);
    } catch (error: any) {
      console.error("Observation Error:", error);
      if (error?.message?.includes("Requested entity was not found")) {
        setHasApiKeySelected(false);
      }
      setErrorMessage("The hairless one is moving too fast. Re-targeting.");
      setAppState(isHazardMode ? AppState.HAZARD : AppState.OBSERVING);
    }
  }, [appState, captureFrame, isMuted, isCommentaryEnabled, isHazardMode]);

  const saveToLog = () => {
    if (observation && currentImage) {
      const newObs: SavedObservation = {
        ...observation,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        imageData: currentImage
      };
      setSavedObservations(prev => [newObs, ...prev]);
      setErrorMessage("Specimen archived in log book.");
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  const deleteObservation = (id: string) => {
    setSavedObservations(prev => prev.filter(obs => obs.id !== id));
  };

  const toggleHazard = () => {
    const newMode = !isHazardMode;
    setIsHazardMode(newMode);
    if (appState !== AppState.IDLE) {
      setAppState(newMode ? AppState.HAZARD : AppState.OBSERVING);
    }
  };

  const startObserving = () => {
    setAppState(isHazardMode ? AppState.HAZARD : AppState.OBSERVING);
    setErrorMessage(null);
  };

  const stopObserving = () => {
    setAppState(AppState.IDLE);
    setObservation(null);
    setCurrentImage(null);
    setMotionIntensity(0);
    geminiRef.current.stopAudio();
  };

  const handleMotionDetected = useCallback((intensity: number) => {
    setMotionIntensity(prev => (prev * 0.7) + (intensity * 0.3));
  }, []);

  if (!hasApiKeySelected) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-zinc-950 text-white">
        <div className="max-w-md w-full text-center space-y-8 bg-zinc-900/50 p-10 rounded-2xl border border-zinc-800 backdrop-blur-xl">
          <div className="mx-auto w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center animate-pulse">
            <Skull className="w-10 h-10 text-zinc-400" />
          </div>
          <h1 className="text-4xl font-bold serif italic">Security Breach</h1>
          <p className="text-zinc-400 text-lg">
            "Listen, pal. This hijacked tech needs a 'paid API key' or the humans will shut us down. Get it together." — Bandit
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full flex items-center justify-center gap-2 bg-zinc-200 hover:bg-white text-black font-bold py-4 px-6 rounded-xl transition-all active:scale-95"
          >
            <LogIn className="w-5 h-5" />
            SELECT API KEY
          </button>
          <p className="text-xs text-zinc-500">
            Check <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="underline">the shiny docs</a> for help.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen w-full flex flex-col md:flex-row overflow-hidden transition-colors duration-500 ${isHazardMode ? 'bg-red-950' : 'bg-zinc-950'}`}>
      <div className={`absolute inset-0 z-0 ${isHazardMode ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(153,27,27,0.3)_0%,rgba(69,10,10,1)_100%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(39,39,42,0.3)_0%,rgba(9,9,11,1)_100%)]'}`} />
      
      <main className="relative flex-1 h-full md:h-screen flex flex-col z-10">
        <header className={`p-4 flex items-center justify-between border-b backdrop-blur-md transition-colors ${isHazardMode ? 'bg-red-900/40 border-red-500/20' : 'bg-black/40 border-white/5'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${isHazardMode ? 'bg-red-600' : 'bg-zinc-800'}`}>
              {isHazardMode ? <AlertOctagon className="w-6 h-6 text-white animate-pulse" /> : <Activity className="w-6 h-6 text-zinc-400" />}
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tighter uppercase text-zinc-100">AI Outdoors</h1>
              <p className={`text-[10px] font-mono tracking-widest leading-none ${isHazardMode ? 'text-red-400' : 'text-zinc-500'}`}>
                {isHazardMode ? 'CRITICAL HAZARD: HIGHWAY MODE' : 'TRASH PANDA SURVEILLANCE v.PRO'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsHistoryOpen(true)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-all relative"
              title="Log Book"
            >
              <BookOpen className="w-5 h-5" />
              {savedObservations.length > 0 && (
                <span className="absolute top-0 right-0 w-2 h-2 bg-yellow-500 rounded-full border border-black" />
              )}
            </button>
            <button 
              onClick={toggleHazard}
              className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold transition-all ${isHazardMode ? 'bg-red-600 border-red-400 text-white animate-bounce' : 'bg-zinc-800/50 border-white/10 text-zinc-400'}`}
              title="Toggle Hazard Mode"
            >
              <Car className="w-3 h-3" />
              {isHazardMode ? 'ESCAPE HIGHWAY' : 'ROUGH SITUATION'}
            </button>

            <div className="flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
              <button 
                onClick={() => setIsCommentaryEnabled(!isCommentaryEnabled)}
                className={`p-2 rounded-full transition-all ${!isCommentaryEnabled ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-100 text-black shadow-sm'}`}
                title={isCommentaryEnabled ? "Narration: ON" : "Narration: OFF"}
              >
                <MessageSquareText className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-2 rounded-full transition-all ${isMuted ? 'bg-red-500/20 text-red-500' : 'text-white hover:bg-white/10'}`}
                title={isMuted ? "Master Audio: MUTED" : "Master Audio: ACTIVE"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        <div className="relative flex-1 bg-black group overflow-hidden">
          <CameraView 
            videoRef={videoRef} 
            isObserving={appState !== AppState.IDLE} 
            onMotionDetected={handleMotionDetected}
          />
          
          {appState !== AppState.IDLE && (
            <HUDOverlay 
              observation={observation} 
              isAnalyzing={appState === AppState.ANALYZING} 
              isHazard={isHazardMode}
              motionIntensity={motionIntensity}
            />
          )}

          {appState === AppState.IDLE && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="p-8 text-center max-w-md space-y-6">
                <Skull className="w-16 h-16 text-zinc-600 mx-auto animate-pulse" />
                <h2 className="text-3xl font-bold serif italic">Observatory Idle</h2>
                <p className="text-zinc-400">"Lens is clean. Point it at a 'Tall Hairless One' and let's see what they're up to."</p>
                <button 
                  onClick={startObserving}
                  className="bg-zinc-100 text-black font-bold py-4 px-10 rounded-full text-lg hover:bg-white transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className="w-5 h-5" />
                  START TRACKING
                </button>
              </div>
            </div>
          )}

          {isHazardMode && appState !== AppState.IDLE && (
            <div className="absolute inset-0 border-8 border-red-600/30 pointer-events-none animate-pulse" />
          )}

          {errorMessage && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-800 border border-white/20 text-white text-sm rounded-lg backdrop-blur-md animate-bounce z-50">
              {errorMessage}
            </div>
          )}
        </div>

        {appState !== AppState.IDLE && (
          <footer className={`p-4 border-t backdrop-blur-lg flex justify-center gap-4 transition-colors ${isHazardMode ? 'bg-red-950/60 border-red-500/20' : 'bg-black/60 border-white/5'}`}>
            <button 
              onClick={runObservationCycle}
              disabled={appState === AppState.ANALYZING}
              className={`px-6 py-3 disabled:opacity-50 text-black font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all ${isHazardMode ? 'bg-red-500 hover:bg-red-400' : 'bg-zinc-200 hover:bg-white'}`}
            >
              {appState === AppState.ANALYZING ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Info className="w-5 h-5" />}
              {appState === AppState.ANALYZING ? "THINKING..." : isHazardMode ? "SCAN FOR EXIT!" : "ANALYZE BEHAVIOR"}
            </button>
            
            {observation && !isHazardMode && appState !== AppState.ANALYZING && (
              <button 
                onClick={saveToLog}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                SAVE TO LOG
              </button>
            )}

            <button 
              onClick={stopObserving}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
            >
              CLOSE FEED
            </button>
          </footer>
        )}
      </main>

      <aside className="w-full md:w-96 border-l border-white/5 bg-zinc-950/80 backdrop-blur-2xl z-20 flex flex-col overflow-y-auto">
        <ObservationPanel observation={observation} isAnalyzing={appState === AppState.ANALYZING} isHazard={isHazardMode} />
      </aside>

      <HistoryModal 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        savedObservations={savedObservations}
        onDelete={deleteObservation}
      />

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default App;
