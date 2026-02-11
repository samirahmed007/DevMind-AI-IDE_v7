
import React, { useState, useEffect, useRef } from 'react';
import { LogEntry, LogLevel } from '../types';
import { Icons } from './Icon';

interface LogStatusProps {
  logs: LogEntry[];
  isExpanded: boolean;
  onToggle: (expanded: boolean) => void;
  onClear: () => void;
}

export const LogStatus: React.FC<LogStatusProps> = ({ logs, isExpanded, onToggle, onClear }) => {
  const [autoHide, setAutoHide] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Fix: Using ReturnType<typeof setTimeout> instead of NodeJS.Timeout for cross-platform/browser compatibility.
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    // Auto-hide logic
    if (isExpanded && autoHide && logs.length > 0) {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        onToggle(false);
      }, 5000); // Hide after 5 seconds of inactivity
    }

    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [logs, isExpanded, autoHide]);

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      default: return 'text-blue-400';
    }
  };

  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case 'error': return <Icons.AlertCircle size={12} />;
      case 'warning': return <Icons.AlertCircle size={12} />;
      case 'success': return <Icons.Check size={12} />;
      default: return <Icons.Info size={12} />;
    }
  };

  return (
    <div className={`absolute bottom-0 left-0 right-0 bg-ide-panel border-t border-ide-border z-30 transition-all duration-300 ease-in-out flex flex-col ${isExpanded ? 'h-48' : 'h-0'}`}>
      <div className="h-8 bg-ide-sidebar border-b border-ide-border flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <Icons.Terminal size={12} className="mr-2" />
            System Output
          </div>
          <button 
            onClick={() => setAutoHide(!autoHide)}
            className={`text-[9px] px-2 py-0.5 rounded border transition-colors ${autoHide ? 'bg-ide-accent/10 border-ide-accent/30 text-ide-accent' : 'border-ide-border text-gray-500'}`}
          >
            Auto-hide: {autoHide ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={onClear} className="p-1 text-gray-500 hover:text-white" title="Clear Logs"><Icons.Trash2 size={12} /></button>
          <button onClick={() => onToggle(false)} className="p-1 text-gray-500 hover:text-white"><Icons.X size={12} /></button>
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-1 bg-black/20 no-scrollbar">
        {logs.length === 0 ? (
          <div className="text-gray-600 italic p-2">No system events recorded.</div>
        ) : (
          logs.map(log => (
            <div key={log.id} className="flex items-start space-x-3 py-0.5 group">
              <span className="text-gray-600 shrink-0 select-none">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className={`${getLevelColor(log.level)} shrink-0 mt-0.5`}>{getLevelIcon(log.level)}</span>
              <span className="text-gray-300 break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
