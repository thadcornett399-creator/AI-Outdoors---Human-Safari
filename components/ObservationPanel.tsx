
import React from 'react';
import { ObservationResult } from '../types';
import { MessageSquare, BarChart3, AlertTriangle, Trash2, Zap, Wind } from 'lucide-react';

interface ObservationPanelProps {
  observation: ObservationResult | null;
  isAnalyzing: boolean;
  isHazard?: boolean;
}

const ObservationPanel: React.FC<ObservationPanelProps> = ({ observation, isAnalyzing, isHazard }) => {
  if (!observation && !isAnalyzing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-zinc-500">
        <Trash2 className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm font-mono uppercase tracking-widest">Awaiting human behavior...</p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="flex-1 p-8 space-y-8 animate-pulse">
        <div className={`h-8 rounded w-3/4 ${isHazard ? 'bg-red-900/50' : 'bg-zinc-800'}`} />
        <div className={`h-4 rounded w-1/2 ${isHazard ? 'bg-red-900/50' : 'bg-zinc-800'}`} />
        <div className="space-y-3">
          <div className={`h-4 rounded w-full ${isHazard ? 'bg-red-900/50' : 'bg-zinc-800'}`} />
          <div className={`h-4 rounded w-full ${isHazard ? 'bg-red-900/50' : 'bg-zinc-800'}`} />
          <div className={`h-4 rounded w-3/4 ${isHazard ? 'bg-red-900/50' : 'bg-zinc-800'}`} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 space-y-8 animate-in fade-in duration-700">
      <section>
        <div className={`flex items-center gap-2 mb-2 ${isHazard ? 'text-red-500' : 'text-zinc-400'}`}>
          {isHazard ? <Zap className="w-4 h-4 animate-pulse" /> : <Trash2 className="w-4 h-4" />}
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase">{isHazard ? 'PANIC LOG' : 'Scavenger Log'}</span>
        </div>
        <h2 className={`text-4xl font-bold serif italic mb-1 leading-tight ${isHazard ? 'text-red-500' : 'text-white'}`}>
          {observation?.commonName}
        </h2>
        <p className="text-sm font-mono text-zinc-500 italic">{observation?.scientificName}</p>
      </section>

      <section className={`border p-4 rounded-2xl relative overflow-hidden transition-colors ${isHazard ? 'bg-red-900/20 border-red-500/30' : 'bg-white/5 border-white/10'}`}>
        <div className="absolute top-0 right-0 p-2 opacity-10">
            {isHazard ? <Wind className="w-20 h-20 -mr-4 -mt-4 rotate-45 text-red-500" /> : <MessageSquare className="w-20 h-20 -mr-4 -mt-4 rotate-12" />}
        </div>
        <div className="flex items-center gap-2 mb-4 relative z-10">
          <MessageSquare className={`w-4 h-4 ${isHazard ? 'text-red-400' : 'text-zinc-300'}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${isHazard ? 'text-red-400' : 'text-zinc-300'}`}>
            {isHazard ? "Bandit's Screams" : "Bandit's Take"}
          </span>
        </div>
        <p className={`text-sm leading-relaxed font-mono whitespace-pre-wrap relative z-10 ${isHazard ? 'text-red-200' : 'text-zinc-300'}`}>
          {observation?.commentary}
        </p>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <BarChart3 className={`w-4 h-4 ${isHazard ? 'text-red-500' : 'text-zinc-400'}`} />
          <span className="text-xs font-bold uppercase tracking-wider">
            {isHazard ? 'VITAL SIGNS' : 'Survival Stats'}
          </span>
        </div>
        
        <StatBar label={isHazard ? "Heart Rate" : "Clumsiness"} value={isHazard ? 95 : (observation?.stats.aggression || 0)} color={isHazard ? "bg-red-500" : "bg-zinc-500"} />
        <StatBar label={isHazard ? "Adrenaline" : "Shiny Object Obsession"} value={isHazard ? 100 : (observation?.stats.intelligence || 0)} color={isHazard ? "bg-orange-500" : "bg-yellow-500"} />
        <StatBar label={isHazard ? "Panic Level" : "Leftover Potential"} value={isHazard ? 98 : (observation?.stats.hydration || 0)} color={isHazard ? "bg-red-600" : "bg-zinc-300"} />
      </section>

      <section className="mt-auto pt-6 border-t border-white/5">
        <div className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${isHazard ? 'bg-red-600 text-white animate-pulse border-red-400' : (observation?.dangerLevel === 'Extreme' ? 'bg-red-500/10 border-red-500/50 text-red-500' : 'bg-zinc-800/50 border-white/10 text-zinc-300')}`}>
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">Status Warning</p>
            <p className="font-bold">{isHazard ? 'IMMINENT VEHICULAR DOOM' : `${observation?.dangerLevel} Alert`}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[10px] font-mono uppercase text-zinc-400">
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
      <div 
        className={`h-full ${color} transition-all duration-1000 ease-out`} 
        style={{ width: `${value}%` }} 
      />
    </div>
  </div>
);

export default ObservationPanel;
