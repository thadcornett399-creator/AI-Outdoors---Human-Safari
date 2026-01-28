
import React from 'react';
import { ObservationResult, AppState } from '../types';
import { Target, Scan, Crosshair, Skull, AlertTriangle, Car, Zap, Eye } from 'lucide-react';

interface HUDOverlayProps {
  observation: ObservationResult | null;
  isAnalyzing: boolean;
  isHazard?: boolean;
  motionIntensity?: number;
}

const HUDOverlay: React.FC<HUDOverlayProps> = ({ observation, isAnalyzing, isHazard, motionIntensity = 0 }) => {
  const hasSignificantMotion = motionIntensity > 0.05;
  const isLocked = motionIntensity > 0.15;

  return (
    <div className={`absolute inset-0 pointer-events-none p-6 flex flex-col justify-between overflow-hidden font-mono transition-all duration-300 ${isHazard ? 'text-red-500' : 'text-white'}`}>
      {/* Corner Brackets */}
      <div className={`absolute top-6 left-6 w-16 h-16 border-t-2 border-l-2 transition-colors ${isHazard ? 'border-red-500' : isLocked ? 'border-yellow-500' : 'border-white/20'}`} />
      <div className={`absolute top-6 right-6 w-16 h-16 border-t-2 border-r-2 transition-colors ${isHazard ? 'border-red-500' : isLocked ? 'border-yellow-500' : 'border-white/20'}`} />
      <div className={`absolute bottom-6 left-6 w-16 h-16 border-b-2 border-l-2 transition-colors ${isHazard ? 'border-red-500' : isLocked ? 'border-yellow-500' : 'border-white/20'}`} />
      <div className={`absolute bottom-6 right-6 w-16 h-16 border-b-2 border-r-2 transition-colors ${isHazard ? 'border-red-500' : isLocked ? 'border-yellow-500' : 'border-white/20'}`} />

      {/* Reticle with Awareness Jitter */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div 
          className={`transition-all duration-200 ${isAnalyzing ? 'scale-150 rotate-90 opacity-100' : hasSignificantMotion ? 'scale-110 opacity-60' : 'scale-100 opacity-20'}`}
          style={{ 
            transform: `translate(${(Math.random() - 0.5) * motionIntensity * 100}px, ${(Math.random() - 0.5) * motionIntensity * 100}px) ${isAnalyzing ? 'scale(1.5) rotate(90deg)' : `scale(${1 + motionIntensity * 0.5})`}` 
          }}
        >
          <Crosshair className={`w-24 h-24 stroke-[0.5px] ${isHazard ? 'text-red-500' : isLocked ? 'text-yellow-500' : 'text-white'}`} />
          
          {isLocked && !isAnalyzing && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-4 flex flex-col items-center gap-1">
              <div className="bg-yellow-500 text-black text-[8px] font-bold px-2 py-0.5 rounded animate-pulse">BIOMETRIC_LOCK</div>
              <div className="text-[8px] text-yellow-500 opacity-80 tracking-widest">READY_FOR_ANALYSIS</div>
            </div>
          )}
        </div>
      </div>

      {/* Top HUD Stats */}
      <div className="flex justify-between items-start">
        <div className={`bg-black/50 backdrop-blur-md border p-3 rounded font-mono text-[10px] space-y-1 transition-colors ${isHazard ? 'border-red-500/50' : isLocked ? 'border-yellow-500/30' : 'border-white/10'}`}>
          <div className="flex justify-between gap-4">
            <span>{isHazard ? 'VELOCITY:' : 'MOTION_SIG:'}</span> 
            <span className={isHazard ? 'text-red-400 animate-pulse' : isLocked ? 'text-yellow-500' : 'text-zinc-400'}>
              {isHazard ? '75 MPH' : `${(motionIntensity * 100).toFixed(1)}%`}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>{isHazard ? 'BEAST_COUNT:' : 'DETECTION:'}</span> 
            <span className={isHazard ? 'text-red-400' : hasSignificantMotion ? 'text-white' : 'text-zinc-400'}>
              {isHazard ? 'INFINITY' : hasSignificantMotion ? 'ACTIVE' : 'IDLE'}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span>{isHazard ? 'SURVIVAL_CHANCE:' : 'SMELL_INDEX:'}</span> 
            <span className={isHazard ? 'text-red-500 font-bold' : 'text-zinc-400'}>
              {isHazard ? 'LOW' : 'HIGH (STALE)'}
            </span>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {isAnalyzing && (
            <div className={`${isHazard ? 'bg-red-600' : 'bg-white'} text-black px-4 py-1 font-bold animate-pulse text-xs`}>
              {isHazard ? 'CALCULATING ESCAPE ROUTE...' : 'DECODING PRIMITIVE BRAIN...'}
            </div>
          )}
          {hasSignificantMotion && !isAnalyzing && (
            <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1 text-[8px] font-bold tracking-widest flex items-center gap-2">
              <Zap className="w-2 h-2 text-yellow-500 animate-pulse" />
              SPECIMEN_ACTIVITY_DETECTED
            </div>
          )}
        </div>
      </div>

      {/* Identification Tags */}
      <div className="flex flex-col items-start gap-4 mb-20 md:mb-0">
        {observation && !isAnalyzing && (
          <div className={`bg-black/80 backdrop-blur-xl border-l-4 p-4 max-w-sm animate-slide-in transition-colors ${isHazard ? 'border-red-500' : 'border-zinc-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              {isHazard ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <Target className="w-4 h-4 text-white" />}
              <span className={`text-[10px] font-bold tracking-widest uppercase ${isHazard ? 'text-red-500' : 'text-zinc-500'}`}>
                {isHazard ? 'HAZARD IDENTIFIED' : 'Specimen Locked'}
              </span>
            </div>
            <h3 className="text-2xl font-bold italic serif leading-tight text-white">{observation.commonName}</h3>
            <p className={`font-mono text-[10px] mb-2 uppercase ${isHazard ? 'text-red-400' : 'text-zinc-500'}`}>{observation.scientificName}</p>
            <div className="flex gap-4">
               <div>
                <p className="text-[8px] text-zinc-400 uppercase">HAZARD</p>
                <p className={`text-xs font-bold ${observation.dangerLevel === 'Extreme' || isHazard ? 'text-red-500 animate-pulse' : 'text-zinc-200'}`}>{observation.dangerLevel}</p>
               </div>
               <div>
                <p className="text-[8px] text-zinc-400 uppercase">{isHazard ? 'TERROR_LEVEL' : 'SHINY_DESIRE'}</p>
                <p className="text-xs font-bold text-zinc-200">{isHazard ? '99' : observation.stats.intelligence}%</p>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom HUD Bar */}
      <div className={`hidden md:flex justify-center items-center gap-12 font-mono text-[10px] tracking-widest transition-colors ${isHazard ? 'text-red-500/50' : 'text-white/20'}`}>
        <div className="flex items-center gap-2 uppercase tracking-tighter italic">
          {isHazard ? 'CRITICAL: SENSOR OVERLOAD' : 'Hijacked Feed: User=Bandit_01'}
        </div>
        <div className="flex items-center gap-2">
          {isHazard ? <Car className="w-3 h-3 animate-bounce" /> : <Eye className={`w-3 h-3 ${hasSignificantMotion ? 'text-yellow-500' : ''}`} />}
          {isHazard ? 'PROXIMITY ALERT: METAL BEASTS' : hasSignificantMotion ? 'TRACKING_MOVEMENT' : 'System Integrity: Compromised'}
        </div>
      </div>
    </div>
  );
};

export default HUDOverlay;
