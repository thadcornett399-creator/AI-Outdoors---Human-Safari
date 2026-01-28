
import React, { useState } from 'react';
import { SavedObservation } from '../types';
import { X, Trash2, Clock, MapPin, ChevronRight, Eye } from 'lucide-react';
import ObservationPanel from './ObservationPanel';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedObservations: SavedObservation[];
  onDelete: (id: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({ isOpen, onClose, savedObservations, onDelete }) => {
  const [selectedObs, setSelectedObs] = useState<SavedObservation | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-6xl h-[90vh] bg-zinc-950 border border-white/10 rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-2xl">
        
        {/* Header (Mobile) */}
        <div className="md:hidden p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-bold serif italic">Trash Panda's Log</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white"><X /></button>
        </div>

        {/* Sidebar: List of captures */}
        <div className={`flex-1 md:w-80 border-r border-white/5 flex flex-col overflow-hidden ${selectedObs ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-6 border-b border-white/5 hidden md:block">
             <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold serif italic">Scavenger Log</h2>
                <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
             </div>
             <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Saved Specimen Data</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {savedObservations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-30">
                <Trash2 className="w-12 h-12 mb-4" />
                <p className="text-xs font-mono uppercase">Log is empty. Start tracking, pal.</p>
              </div>
            ) : (
              savedObservations.map((obs) => (
                <button
                  key={obs.id}
                  onClick={() => setSelectedObs(obs)}
                  className={`w-full text-left p-3 rounded-xl border transition-all group flex gap-3 items-center ${
                    selectedObs?.id === obs.id 
                      ? 'bg-zinc-800 border-zinc-500' 
                      : 'bg-zinc-900/50 border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 border border-white/10">
                    <img src={`data:image/jpeg;base64,${obs.imageData}`} alt="" className="w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm truncate">{obs.commonName}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail View */}
        <div className={`flex-[2] bg-zinc-900/20 relative flex flex-col overflow-hidden ${!selectedObs ? 'hidden md:flex' : 'flex'}`}>
          {selectedObs ? (
            <div className="flex-1 flex flex-col overflow-y-auto">
              <div className="p-4 md:p-0 relative">
                <button 
                  onClick={() => setSelectedObs(null)} 
                  className="md:hidden absolute top-4 left-4 z-10 p-2 bg-black/50 rounded-full"
                >
                  <ChevronRight className="w-6 h-6 rotate-180" />
                </button>
                
                <div className="w-full h-64 md:h-80 relative">
                   <img 
                    src={`data:image/jpeg;base64,${selectedObs.imageData}`} 
                    className="w-full h-full object-cover" 
                    alt="Capture"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                  <div className="absolute bottom-6 left-6 flex items-center gap-4">
                     <button 
                      onClick={() => onDelete(selectedObs.id)}
                      className="p-3 bg-red-950/50 border border-red-500/30 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                     >
                       <Trash2 className="w-5 h-5" />
                     </button>
                  </div>
                </div>

                <div className="px-6 md:px-12 -mt-10">
                  <ObservationPanel observation={selectedObs} isAnalyzing={false} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-700 p-12 text-center">
              <Eye className="w-16 h-16 mb-6 opacity-10" />
              <h3 className="text-2xl font-bold serif italic mb-2">No Record Selected</h3>
              <p className="max-w-xs text-sm">Select a specimen from the log to view its full behavioral analysis and capture data.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
