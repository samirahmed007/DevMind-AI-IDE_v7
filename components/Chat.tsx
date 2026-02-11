
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
    
    // Auto-expand when streaming starts
    useEffect(() => {
        if (isStreaming) {
            setIsExpanded(true);
        }
    }, [isStreaming]);

    // Ensure it shows if thought is present
    const shouldShow = thought.trim().length > 0 || isStreaming;
    if (!shouldShow) return null;

    return (
        <div className="mb-4 overflow-hidden border-l-2 border-ide-accent bg-ide-activity/30 rounded-r-lg shadow-sm border border-ide-border border-l-ide-accent">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className={`w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${isExpanded ? 'bg-ide-accent/10 text-ide-accent' : 'text-gray-500 hover:text-ide-accent'}`}
            >
                <div className="flex items-center">
                    <Icons.Brain size={14} className={`mr-2 ${isStreaming ? 'animate-pulse text-ide-accent' : ''}`} />
                    <span>Thought Process {isStreaming && !thought ? '...' : ''}</span>
                </div>
                {isExpanded ? <Icons.ChevronDown size={14} /> : <Icons.ChevronRight size={14} />}
            </button>
            {isExpanded && (
                <div className="px-3 py-3 text-[11px] font-sans text-gray-400 leading-relaxed italic animate-in fade-in slide-in-from-top-1 duration-200 bg-black/5">
                    {thought ? thought : (
                        <div className="flex items-center space-x-2 text-gray-500 animate-pulse">
                            <Icons.RefreshCw size={10} className="animate-spin" />
                            <span>AI is reasoning...</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const ChatPanel: React.FC<ChatProps> = ({ 
    messages, 
    onSendMessage, 
    onEnhancePrompt, 
    onApplyAction, 
    onClearChat,
    isStreaming,
    workspaceFiles,
    onAttachFile
}) => {
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [showEnhance, setShowEnhance] = useState(false);
    const [confirmClear, setConfirmClear] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if ((!input.trim() && attachments.length === 0) || isStreaming) return;
        onSendMessage(input, attachments);
        setInput('');
        setAttachments([]);
        setShowEnhance(false);
    };

    const handleEnhance = async () => {
        if (!input.trim()) return;
        const enhanced = await onEnhancePrompt(input);
        setInput(enhanced);
        setShowEnhance(true);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            Array.from(e.target.files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    const res = evt.target?.result as string;
                    setAttachments(prev => [...prev, {
                        name: file.name,
                        mimeType: file.type,
                        data: res
                    }]);
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const triggerClear = () => {
        onClearChat();
        setConfirmClear(false);
    };

    return (
        <div className="flex flex-col h-full bg-ide-panel w-full border-l border-ide-border shadow-inner">
            <div className="p-3 border-b border-ide-border font-bold text-xs uppercase tracking-wider flex justify-between items-center shrink-0 h-10 bg-ide-sidebar/50">
                <div className="flex items-center space-x-2">
                    <Icons.MessageSquare size={14} className="text-ide-accent" />
                    <span>AI Assistant</span>
                </div>
                <div className="flex items-center space-x-3">
                     {!confirmClear ? (
                         <button 
                            onClick={() => setConfirmClear(true)}
                            className="text-[10px] text-gray-500 hover:text-red-400 transition-colors flex items-center space-x-1 uppercase tracking-tighter group"
                            title="Clear conversation history"
                         >
                            <Icons.Trash2 size={12} className="group-hover:animate-pulse" />
                            <span>Clear</span>
                         </button>
                     ) : (
                         <div className="flex items-center space-x-2 animate-in fade-in slide-in-from-right-2 duration-200">
                             <button 
                                onClick={() => setConfirmClear(false)}
                                className="text-[10px] text-gray-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors uppercase"
                             >
                                Cancel
                             </button>
                             <button 
                                onClick={triggerClear}
                                className="text-[10px] bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-1.5 py-0.5 rounded transition-all uppercase font-bold"
                             >
                                Confirm Clear
                             </button>
                         </div>
                     )}
                     {!confirmClear && (
                         <>
                            <div className="w-[1px] h-3 bg-ide-border mx-1"></div>
                            <span className="text-[10px] text-green-500 font-normal normal-case flex items-center">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                                Live
                            </span>
                         </>
                     )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-ide-bg/20 no-scrollbar">
                {messages.map((msg: ChatMessage, idx) => {
                    const isUser = msg.role === 'user';
                    const isLastMsg = idx === messages.length - 1;
                    
                    return (
                        <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group/msg animate-in fade-in duration-300`}>
                            {/* Message Header */}
                            <div className={`flex items-center mb-1.5 space-x-2 text-[10px] font-bold uppercase tracking-widest ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span className={isUser ? 'text-ide-accent ml-2' : 'text-gray-400'}>
                                    {isUser ? 'You' : msg.modelName || 'Assistant'}
                                </span>
                                <span className="text-gray-600 font-normal">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <div 
                                className={`max-w-[95%] rounded-2xl p-4 text-sm shadow-sm transition-all ${
                                    isUser 
                                    ? 'bg-ide-accent text-white rounded-tr-none' 
                                    : 'bg-ide-activity border border-ide-border text-ide-text rounded-tl-none'
                                }`}
                            >
                                {/* Thinking Block */}
                                {msg.role === 'assistant' && (
                                    <ThoughtBlock 
                                        thought={msg.thought || ""} 
                                        isStreaming={isStreaming && isLastMsg} 
                                    />
                                )}

                                {/* Attachments Display */}
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className={`flex flex-wrap gap-2 mb-3 p-2 rounded-xl ${isUser ? 'bg-white/10' : 'bg-black/20'}`}>
                                        {msg.attachments.map((att, i) => (
                                            <div key={i} className="flex items-center space-x-2 px-2 py-1.5 bg-ide-panel/50 border border-white/5 rounded-lg">
                                                {att.mimeType.startsWith('image') ? (
                                                    <Icons.Image size={14} className="text-blue-400" />
                                                ) : (
                                                    <Icons.FileText size={14} className="text-red-400" />
                                                )}
                                                <span className="text-[10px] font-mono truncate max-w-[120px]">{att.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="whitespace-pre-wrap font-sans break-words leading-relaxed selection:bg-white/20">
                                    {msg.content}
                                </div>

                                {/* Pending Actions */}
                                {msg.pendingActions && msg.pendingActions.map((action, actionIdx) => (
                                    <div key={actionIdx} className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5 shadow-inner animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center justify-between mb-2.5">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 flex items-center">
                                                <Icons.Code size={12} className="mr-2" />
                                                {action.type === 'edit' ? 'Patch Request' : 'File Creation'}
                                            </span>
                                            {!action.applied ? (
                                                <button 
                                                    onClick={() => onApplyAction(action)}
                                                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-[10px] font-bold uppercase tracking-tighter rounded-lg flex items-center transition-all shadow-lg active:scale-95"
                                                >
                                                    <Icons.Check size={10} className="mr-1.5" /> Apply Edits
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-green-500 font-bold uppercase tracking-tighter flex items-center">
                                                    <Icons.Check size={12} className="mr-1.5" /> Applied to FS
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10px] font-mono bg-black/60 p-3 rounded-lg max-h-48 overflow-auto border border-white/5 scrollbar-thin">
                                            {action.type === 'edit' ? (
                                                <>
                                                    <div className="text-red-400/50 line-through mb-1.5">{(action.data as FileEdit).search}</div>
                                                    <div className="text-green-400 font-bold">{(action.data as FileEdit).replace}</div>
                                                </>
                                            ) : (
                                                <div className="text-blue-300">
                                                    <div className="font-bold border-b border-white/10 pb-1 mb-2">Target: {(action.data as FileCreate).path}</div>
                                                    <div className="opacity-80 italic">File content staged for generation...</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
                {isStreaming && !messages[messages.length - 1].content && !messages[messages.length - 1].thought && (
                    <div className="flex items-start">
                        <div className="bg-ide-activity p-3 rounded-2xl border border-ide-border animate-pulse shadow-sm">
                            <Icons.RefreshCw className="animate-spin text-ide-accent" size={16} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-ide-border bg-ide-panel shrink-0 shadow-2xl relative">
                 {/* Attachments Preview */}
                 {attachments.length > 0 && (
                    <div className="flex space-x-2 mb-3 overflow-x-auto pb-2 scrollbar-none animate-in slide-in-from-bottom-2">
                        {attachments.map((att, index) => (
                            <div key={index} className="relative group flex-shrink-0">
                                {att.mimeType.startsWith('image') ? (
                                    <img src={att.data} alt="preview" className="h-14 w-14 object-cover rounded-xl border-2 border-ide-border ring-2 ring-ide-accent/20" />
                                ) : (
                                    <div className="h-14 w-14 bg-ide-activity flex items-center justify-center rounded-xl border-2 border-ide-border ring-2 ring-ide-accent/20">
                                        <Icons.FileText size={24} className="text-gray-500" />
                                    </div>
                                )}
                                <button 
                                    onClick={() => removeAttachment(index)}
                                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 shadow-xl hover:scale-110 transition-transform"
                                >
                                    <Icons.X size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {showEnhance && (
                    <div className="mb-3 flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-900/10 p-2.5 rounded-xl border border-blue-500/20 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center">
                            <Icons.Wand2 size={12} className="mr-2" />
                            <span>Prompt Optimized for Agent Execution</span>
                        </div>
                        <button onClick={() => setInput('')} className="hover:underline text-gray-500">Reset</button>
                    </div>
                )}

                <div className="relative group/input">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe features or code changes..."
                        className="w-full bg-ide-activity border border-ide-border rounded-2xl p-4 pr-32 text-sm text-white focus:border-ide-accent focus:ring-4 ring-ide-accent/10 outline-none resize-none min-h-[100px] shadow-inner transition-all scrollbar-thin"
                    />
                    
                    <div className="absolute bottom-3 right-3 flex space-x-2 p-1.5 bg-ide-panel/90 backdrop-blur-md rounded-xl border border-ide-border shadow-2xl">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} multiple accept="image/*,.pdf" />
                        
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-2 text-gray-400 hover:text-white bg-ide-activity rounded-lg border border-ide-border hover:bg-ide-activity/80 transition-all active:scale-90"
                            title="Add Visual Context"
                        >
                            <Icons.Image size={18} />
                        </button>
                        
                        <button 
                            onClick={handleEnhance}
                            className="p-2 text-purple-400 hover:text-white bg-ide-activity rounded-lg border border-ide-border hover:bg-purple-900/20 transition-all active:scale-90"
                            title="AI Rewrite"
                        >
                            <Icons.Wand2 size={18} />
                        </button>

                        <button 
                            onClick={handleSend}
                            disabled={isStreaming}
                            className="p-2 bg-ide-accent text-white rounded-lg hover:bg-blue-600 transition-all disabled:opacity-50 shadow-xl active:scale-90"
                        >
                            <Icons.Play size={18} fill="currentColor" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
