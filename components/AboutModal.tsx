
import React from 'react';
import { Icons } from './Icon';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-ide-panel border border-ide-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-ide-accent/10 rounded-2xl flex items-center justify-center text-ide-accent">
            <Icons.Code size={32} />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white tracking-tight">DevMind AI IDE</h2>
            <p className="text-xs text-ide-accent font-bold uppercase tracking-widest">Version 1.0.0 Stable</p>
          </div>

          <div className="bg-ide-activity/50 p-4 rounded-xl border border-ide-border text-left space-y-3">
            <div className="flex items-center text-sm text-gray-300">
              <Icons.Info size={14} className="mr-3 text-ide-accent" />
              <span>Professional AI Coding Workspace</span>
            </div>
            <div className="flex items-center text-sm text-gray-300">
              <Icons.Monitor size={14} className="mr-3 text-ide-accent" />
              <span>Multi-Provider Neural Architecture</span>
            </div>
            <div className="pt-2 border-t border-ide-border">
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Developed by</p>
              <p className="text-sm font-bold text-white mt-1">Samir Uddin Ahmed</p>
            </div>
          </div>

          <div className="flex flex-col space-y-3">
             <button 
                onClick={onClose}
                className="w-full bg-ide-accent text-white py-3 rounded-xl text-sm font-bold hover:brightness-110 transition-all active:scale-95"
             >
                Close Dashboard
             </button>
             <p className="text-[10px] text-gray-500 italic">Built for the future of software engineering.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
