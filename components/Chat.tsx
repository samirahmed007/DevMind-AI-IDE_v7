import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, FileEdit, FileAttachment, AgentAction, FileCreate } from '../types';
import { Icons } from './Icon';

interface ChatProps {
    messages: ChatMessage[];
    onSendMessage: (text: string, attachments: FileAttachment[]) => void;
    onEnhancePrompt: (text: string) => Promise<string>;
    onApplyAction: (action: AgentAction) => void;
    onClearChat: () => void;
    isStreaming: boolean;
    workspaceFiles: { name: string, id: string }[];
    onAttachFile: (fileId: string) => void; 
}

const ThoughtBlock: React.FC<{ thought: string, isStreaming: boolean }> = ({ thought, isStreaming }) => {
    const [isExpanded, setIsExpanded] = useState(isStreaming);
    useEffect(() => { if (isStreaming) setIsExpanded(true); }, [isStreaming]);
    if (!thought.trim() && !isStreaming) return null;

    return (
        <div className="mb-4 overflow-hidden border border-ide-border bg-ide-activity/30 rounded-xl shadow-sm">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${isExpanded ? 'bg-ide-accent/15 text-ide-accent' : 'text-gray-500 hover:text-ide-accent'}`}
            >
                <div className="flex items-center">
                    <Icons.Brain size={18} strokeWidth={2.5} className={`mr-3 ${isStreaming ? 'animate-pulse text-ide-accent' : ''}`} />
                    <span>Thinking Log</span>
                </div>
                {isExpanded ? <Icons.ChevronDown size={18} strokeWidth={2.5} /> : <Icons.ChevronRight size={18} strokeWidth={2.5} />}
            </button>
            {isExpanded && (
                <div className="px-4 py-4 text-[12px] font-sans text-gray-400 leading-relaxed italic animate-in fade-in slide-in-from-top-1 duration-200">
                    {thought ? thought : <div className="flex items-center space-x-2 animate-pulse"><Icons.RefreshCw size={14} className="animate-spin" /><span>Processing logic...</span></div>}
                </div>
            )}
        </div>
    );
};

export const ChatPanel: React.FC<ChatProps> = ({ 
    messages, onSendMessage, onEnhancePrompt, onApplyAction, onClearChat, isStreaming
}) => {
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [confirmClear, setConfirmClear] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const handleSend = () => {
        if ((!input.trim() && attachments.length === 0) || isStreaming) return;
        onSendMessage(input, attachments);
        setInput('');
        setAttachments([]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            (Array.from(e.target.files) as File[]).forEach((file: File) => {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    setAttachments(prev => [...prev, { name: file.name, mimeType: file.type, data: evt.target?.result as string }]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    return (
        <div className="flex flex-col h-full bg-ide-panel w-full">
            <div className="p-4 border-b border-ide-border font-black text-xs uppercase tracking-[0.2em] flex justify-between items-center shrink-0 h-12 bg-ide-sidebar/40">
                <div className="flex items-center space-x-3">
                    <Icons.MessageSquare size={22} strokeWidth={2.5} className="text-ide-accent" />
                    <span>Neural Assistant</span>
                </div>
                {!confirmClear ? (
                    <button onClick={() => setConfirmClear(true)} className="text-gray-500 hover:text-red-400 p-1 transition-colors"><Icons.Trash2 size={20} strokeWidth={2.5} /></button>
                ) : (
                    <div className="flex items-center space-x-2 animate-in slide-in-from-right-2">
                        <button onClick={() => setConfirmClear(false)} className="text-[10px] text-gray-400 font-bold uppercase hover:text-white">Cancel</button>
                        <button onClick={() => { onClearChat(); setConfirmClear(false); }} className="text-[10px] bg-red-600 px-2 py-1 rounded font-bold uppercase text-white shadow-lg">Confirm</button>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-ide-bg/30 no-scrollbar">
                {messages.map((msg, idx) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-300`}>
                        <div className={`flex items-center mb-2 space-x-3 text-[10px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className={msg.role === 'user' ? 'text-ide-accent ml-3' : 'text-gray-400'}>{msg.role === 'user' ? 'Operator' : (msg.modelName || 'Neural Core')}</span>
                            <span className="text-gray-600 font-bold">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className={`max-w-[95%] rounded-2xl p-4 text-[14px] shadow-lg leading-relaxed ${msg.role === 'user' ? 'bg-ide-accent text-white rounded-tr-none' : 'bg-ide-activity border border-ide-border text-ide-text rounded-tl-none shadow-xl'}`}>
                            {msg.role === 'assistant' && <ThoughtBlock thought={msg.thought || ""} isStreaming={isStreaming && idx === messages.length - 1} />}
                            {msg.attachments?.map((att, i) => (
                                <div key={i} className="flex items-center space-x-3 mb-3 p-2 bg-black/20 rounded-xl border border-white/5">
                                    {att.mimeType.startsWith('image') ? <Icons.Image size={20} className="text-blue-400" /> : <Icons.FileText size={20} className="text-red-400" />}
                                    <span className="text-[11px] font-bold truncate max-w-[150px]">{att.name}</span>
                                </div>
                            ))}
                            <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
                            {msg.pendingActions?.map((action, i) => (
                                <div key={i} className="mt-5 p-4 bg-black/40 rounded-xl border border-white/10 shadow-inner overflow-hidden">
                                    <div className="flex items-center justify-between mb-4 shrink-0">
                                        <span className="text-[11px] font-black uppercase text-blue-400 flex items-center shrink-0">
                                            <Icons.Code size={18} strokeWidth={2.5} className="mr-3" />
                                            {action.type === 'edit' ? 'System Patch' : 'New Object'}
                                        </span>
                                        {!action.applied ? (
                                            <button onClick={() => onApplyAction(action)} className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase rounded-lg shadow-xl active:scale-95 transition-all shrink-0">Apply Change</button>
                                        ) : (
                                            <span className="text-[10px] text-green-500 font-black uppercase flex items-center shrink-0"><Icons.Check size={18} strokeWidth={3} className="mr-2" />Committed</span>
                                        )}
                                    </div>
                                    <div className="text-[10px] font-mono bg-black/60 p-3 rounded-lg border border-white/5 space-y-3 flex flex-col">
                                        <div className="text-gray-500 uppercase tracking-tighter shrink-0">TARGET: {(action.data as any).filePath || (action.data as any).path}</div>
                                        
                                        <div className="max-h-[300px] overflow-y-auto no-scrollbar space-y-4 pr-1">
                                            {action.type === 'edit' ? (
                                                <>
                                                    <div className="space-y-1">
                                                        <div className="text-[9px] font-black uppercase text-blue-500/60 flex items-center">
                                                            <div className="w-1 h-1 bg-blue-500 mr-2 rounded-full"></div> Find:
                                                        </div>
                                                        <pre className="whitespace-pre bg-white/5 p-2 rounded border border-white/5 text-[10px] leading-tight overflow-x-auto selection:bg-blue-500/20">
                                                            {(action.data as FileEdit).search}
                                                        </pre>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="text-[9px] font-black uppercase text-green-500/60 flex items-center">
                                                            <div className="w-1 h-1 bg-green-500 mr-2 rounded-full"></div> Replace:
                                                        </div>
                                                        <pre className="whitespace-pre bg-white/5 p-2 rounded border border-white/5 text-[10px] leading-tight overflow-x-auto selection:bg-green-500/20">
                                                            {(action.data as FileEdit).replace}
                                                        </pre>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className="text-[9px] font-black uppercase text-ide-accent/60 flex items-center">
                                                        <div className="w-1 h-1 bg-ide-accent mr-2 rounded-full"></div> Initial Content:
                                                    </div>
                                                    <pre className="whitespace-pre bg-white/5 p-2 rounded border border-white/5 text-[10px] leading-tight overflow-x-auto">
                                                        {(action.data as FileCreate).content}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-5 bg-ide-panel border-t border-ide-border shrink-0 shadow-2xl space-y-4">
                {attachments.length > 0 && (
                    <div className="flex space-x-3 pb-2 overflow-x-auto no-scrollbar">
                        {attachments.map((att, i) => (
                            <div key={i} className="relative group flex-shrink-0">
                                {att.mimeType.startsWith('image') ? <img src={att.data} className="h-14 w-14 object-cover rounded-xl border-2 border-ide-border ring-2 ring-ide-accent/20" /> : <div className="h-14 w-14 bg-ide-activity flex items-center justify-center rounded-xl border-2 border-ide-border"><Icons.FileText size={28} /></div>}
                                <button onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-xl"><Icons.X size={12} strokeWidth={3} /></button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="bg-ide-activity border border-ide-border rounded-2xl overflow-hidden focus-within:border-ide-accent focus-within:ring-4 ring-ide-accent/10 transition-all shadow-inner">
                    <textarea 
                        value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Command neural core..."
                        className="w-full bg-transparent p-5 text-[14px] text-white outline-none resize-none min-h-[90px] font-sans leading-relaxed"
                    />
                    <div className="flex items-center justify-between px-5 py-3 bg-black/10 border-t border-white/5">
                        <div className="flex items-center space-x-4">
                            <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} multiple accept="image/*,.pdf" />
                            <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-500 hover:text-white transition-colors" title="Attach Visual"><Icons.Image size={24} strokeWidth={2.5} /></button>
                            <button onClick={async () => setInput(await onEnhancePrompt(input))} className="p-2.5 text-purple-400 hover:text-purple-300 transition-colors" title="AI Polish"><Icons.Wand2 size={24} strokeWidth={2.5} /></button>
                        </div>
                        <button onClick={handleSend} disabled={isStreaming} className="bg-ide-accent hover:bg-blue-600 disabled:opacity-50 text-white p-3 rounded-xl shadow-xl transition-all active:scale-95 flex items-center justify-center group">
                            <Icons.Play size={24} strokeWidth={2.5} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
