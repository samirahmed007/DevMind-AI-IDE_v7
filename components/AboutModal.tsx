import React from 'react';
import { Icons } from './Icon';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-ide-panel border border-ide-border w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-10 text-center space-y-8">
          <div className="mx-auto w-24 h-24 bg-ide-accent/15 rounded-[32px] flex items-center justify-center text-ide-accent shadow-xl border border-ide-accent/20">
            <Icons.Code size={48} strokeWidth={2.5} />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white tracking-[0.1em] uppercase">DevMind IDE</h2>
            <p className="text-[11px] text-ide-accent font-black uppercase tracking-[0.4em]">v1.0.0 Neural Edition</p>
          </div>

          <div className="bg-ide-activity/30 p-6 rounded-3xl border border-white/5 text-left space-y-4 shadow-inner">
            <div className="flex items-center text-[13px] font-bold text-gray-300">
              <Icons.Brain size={18} strokeWidth={2.5} className="mr-4 text-ide-accent" />
              <span>Agentic Neural Core</span>
            </div>
            <div className="flex items-center text-[13px] font-bold text-gray-300">
              <Icons.Monitor size={18} strokeWidth={2.5} className="mr-4 text-ide-accent" />
              <span>Multi-Pipeline Workspace</span>
            </div>
            <div className="pt-4 border-t border-white/5">
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Developed by</p>
              <p className="text-base font-black text-white tracking-wide">SAMIR UDDIN AHMED</p>
            </div>
          </div>

          <div className="space-y-4">
             <button 
                onClick={onClose}
                className="w-full bg-ide-accent hover:bg-blue-600 text-white py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95"
             >
                Resume Session
             </button>
             <p className="text-[10px] text-gray-500 italic font-medium">The future of software architecture, today.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
