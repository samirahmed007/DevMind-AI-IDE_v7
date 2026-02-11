import React, { useState, useEffect, useRef } from 'react';
import { FileSystemItem, ChatMessage, FileEdit, SettingsState, FileAttachment, AgentAction, FileCreate, ProviderType, LogEntry, LogLevel } from './types';
import { Explorer } from './components/Explorer';
import { EditorArea } from './components/Editor';
import { ChatPanel } from './components/Chat';
import { SettingsPanel } from './components/Settings';
import { LogStatus } from './components/LogStatus';
import { AboutModal } from './components/AboutModal';
import { Icons } from './components/Icon';
import { DEFAULT_SETTINGS, DEFAULT_MODELS } from './constants';
import { streamResponse, enhancePrompt } from './services/aiService';

const INITIAL_MESSAGES: ChatMessage[] = [{
    id: 'welcome', role: 'assistant', content: 'Hello! I am DevMind. How can I help you code today?', timestamp: Date.now(), modelName: 'System'
}];

const INITIAL_FILES: Record<string, FileSystemItem> = {
    '1': { 
        id: '1', 
        name: 'welcome.md', 
        path: '/welcome.md', 
        type: 'file', 
        language: 'markdown', 
        isOpen: false, 
        content: '# 🚀 Welcome to DevMind AI IDE\n\n### Usage Guide:\n1. **AI Assistant**: Use the chat to describe changes.\n2. **Apply Edits**: Click **Apply** on AI suggestions. The engine now uses resilient matching to handle line-ending and entity differences.\n3. **Explorer**: Use icons to manage files.\n\n### Model Support:\n- **Gemini**: Now with full API key management in Settings.\n- **Visuals**: Upload images/PDFs for visual coding support.' 
    }
};

export default function App() {
    const [files, setFiles] = useState<Record<string, FileSystemItem>>(INITIAL_FILES);
    const [activeFileId, setActiveFileId] = useState<string | null>('1');
    const [openFileIds, setOpenFileIds] = useState<string[]>(['1']);
    const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
    const [isStreaming, setIsStreaming] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [showChat, setShowChat] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [showAbout, setShowAbout] = useState(false);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isLogsExpanded, setIsLogsExpanded] = useState(false);
    
    const [settings, setSettings] = useState<SettingsState>(() => {
        const saved = localStorage.getItem('devmind_settings');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    });

    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);

    useEffect(() => {
        localStorage.setItem('devmind_settings', JSON.stringify(settings));
        document.documentElement.className = `theme-${settings.theme}`;
    }, [settings]);

    const addLog = (message: string, level: LogLevel = 'info') => {
        const newLog: LogEntry = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            message,
            level,
            timestamp: Date.now()
        };
        setLogs(prev => [...prev, newLog]);
        if (level === 'error') setIsLogsExpanded(true);
    };

    const openFile = (id: string) => {
        if (!openFileIds.includes(id)) setOpenFileIds(prev => [...prev, id]);
        setActiveFileId(id);
    };

    const closeFile = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setOpenFileIds(prev => {
            const newOpen = prev.filter(fid => fid !== id);
            if (activeFileId === id) setActiveFileId(newOpen.length > 0 ? newOpen[newOpen.length - 1] : null);
            return newOpen;
        });
    };

    const handleFileClick = (id: string) => openFile(id);

    const handleEditorChange = (value: string | undefined) => {
        if (!activeFileId || value === undefined) return;
        setFiles(prev => ({ ...prev, [activeFileId]: { ...prev[activeFileId], content: value } }));
    };

    const handleCreateFile = (name: string, parentId?: string | null, content: string = '') => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const parent = parentId ? files[parentId] : null;
        const newFile: FileSystemItem = { 
            id, name, path: parent ? `${parent.path}/${name}` : `/${name}`, type: 'file', content, language: name.split('.').pop() || 'plaintext', parentId: parentId || null
        };
        setFiles(prev => ({ ...prev, [id]: newFile }));
        addLog(`File created: ${name}`, 'success');
        openFile(id);
    };

    const handleCreateFolder = (name: string, parentId?: string | null) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const parent = parentId ? files[parentId] : null;
        const newFolder: FileSystemItem = { 
            id, name, path: parent ? `${parent.path}/${name}` : `/${name}`, type: 'folder', parentId: parentId || null
        };
        setFiles(prev => ({ ...prev, [id]: newFolder }));
        addLog(`Folder created: ${name}`, 'success');
    };

    const handleUpload = (fileList: FileList) => {
        Array.from(fileList).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const id = Date.now().toString() + Math.random().toString().slice(2, 6);
                const relativePath = (file as any).webkitRelativePath || file.name;
                const name = relativePath.split('/').pop() || file.name;
                const newFile: FileSystemItem = { id, name, path: '/' + relativePath, type: 'file', content, mimeType: file.type, language: name.split('.').pop() || 'plaintext' };
                setFiles(prev => ({ ...prev, [id]: newFile }));
                addLog(`Uploaded: ${name}`, 'info');
                openFile(id);
            };
            if (file.type.startsWith('image') || file.type === 'application/pdf') reader.readAsDataURL(file);
            else reader.readAsText(file);
        });
    };

    const handleDelete = (id: string) => {
        const itemName = files[id]?.name;
        setFiles(prev => { 
            const next = { ...prev }; 
            const idsToDelete = new Set([id]);
            let count;
            do {
                count = idsToDelete.size;
                (Object.values(next) as FileSystemItem[]).forEach(f => {
                    if (f.parentId && idsToDelete.has(f.parentId)) idsToDelete.add(f.id);
                });
            } while (idsToDelete.size !== count);
            idsToDelete.forEach(toDel => {
                delete next[toDel];
                setOpenFileIds(prevOpen => prevOpen.filter(oid => oid !== toDel));
                if (activeFileId === toDel) setActiveFileId(null);
            });
            return next; 
        });
        addLog(`Deleted item: ${itemName}`, 'warning');
    };

    const handleMoveItem = (itemId: string, targetParentId: string | null) => {
        setFiles(prev => {
            const item = prev[itemId];
            if (!item || targetParentId === itemId) return prev;
            let current = targetParentId;
            while (current) {
                if (current === itemId) return prev;
                current = prev[current]?.parentId || null;
            }
            const targetParent = targetParentId ? prev[targetParentId] : null;
            const newPath = targetParent ? `${targetParent.path}/${item.name}` : `/${item.name}`;
            addLog(`Moved ${item.name} to ${targetParent ? targetParent.path : 'root'}`, 'info');
            return { ...prev, [itemId]: { ...item, parentId: targetParentId, path: newPath } };
        });
    };

    const handleDownloadItem = (item: FileSystemItem) => {
        if (item.type === 'file') {
            const element = document.createElement('a');
            const file = new Blob([item.content || ''], { type: item.mimeType || 'text/plain' });
            element.href = URL.createObjectURL(file);
            element.download = item.name;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
            addLog(`Downloaded file: ${item.name}`, 'info');
        } else {
            const folderContent: Record<string, FileSystemItem> = {};
            const getDescendants = (parentId: string) => {
                (Object.values(files) as FileSystemItem[]).forEach(f => {
                    if (f.parentId === parentId) {
                        folderContent[f.id] = f;
                        if (f.type === 'folder') getDescendants(f.id);
                    }
                });
            };
            folderContent[item.id] = item;
            getDescendants(item.id);
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(folderContent, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `${item.name}_backup.json`);
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            addLog(`Exported folder: ${item.name}`, 'info');
        }
    };

    const downloadWorkspace = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(files, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "devmind_workspace_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        addLog(`Workspace exported`, 'success');
    };

    const handleClearChat = () => {
        setMessages(INITIAL_MESSAGES);
        addLog(`Chat history cleared`, 'info');
    };

    const handleApplyAction = (action: AgentAction) => {
        if (action.type === 'edit') {
            const editData = action.data as FileEdit;
            const targetFile = (Object.values(files) as FileSystemItem[]).find(f => 
                f.path === editData.filePath || 
                f.path === '/' + editData.filePath || 
                f.name === editData.filePath ||
                f.path.endsWith(editData.filePath)
            );

            if (!targetFile) {
                addLog(`Patch failed: File ${editData.filePath} not found`, 'error');
                return;
            }

            const normalize = (s: string) => s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            
            const searchBlock = normalize(editData.search);
            const replaceBlock = normalize(editData.replace);

            let source = "";
            let editorModel: any = null;

            if (editorRef.current && monacoRef.current && activeFileId === targetFile.id) {
                editorModel = editorRef.current.getModel();
                source = normalize(editorModel.getValue());
            } else {
                source = normalize(targetFile.content || "");
            }

            // Attempt exact match
            let matchIdx = source.indexOf(searchBlock);
            
            // Fallback: Relaxed indentation match (per-line trim comparison)
            if (matchIdx === -1) {
                const sourceLines = source.split('\n');
                const searchLines = searchBlock.split('\n');
                
                for (let i = 0; i <= sourceLines.length - searchLines.length; i++) {
                    let matches = true;
                    for (let j = 0; j < searchLines.length; j++) {
                        if (sourceLines[i + j].trim() !== searchLines[j].trim()) {
                            matches = false;
                            break;
                        }
                    }
                    if (matches) {
                        // Recalculate matchIdx from source to include the specific line block
                        const potentialBlock = sourceLines.slice(i, i + searchLines.length).join('\n');
                        matchIdx = source.indexOf(potentialBlock);
                        break;
                    }
                }
            }

            if (matchIdx !== -1) {
                if (editorModel && monacoRef.current && activeFileId === targetFile.id) {
                    const before = source.substring(0, matchIdx);
                    const linesBefore = before.split('\n');
                    const startLine = linesBefore.length;
                    const startCol = linesBefore[linesBefore.length - 1].length + 1;

                    const matchedContentInSource = source.substr(matchIdx, searchBlock.length);
                    const matchedLines = matchedContentInSource.split('\n');
                    const endLine = startLine + matchedLines.length - 1;
                    const endCol = matchedLines.length > 1 
                        ? matchedLines[matchedLines.length - 1].length + 1 
                        : startCol + matchedContentInSource.length;

                    const range = new monacoRef.current.Range(startLine, startCol, endLine, endCol);
                    
                    editorRef.current.executeEdits('devmind-ai', [{
                        range: range,
                        text: replaceBlock,
                        forceMoveMarkers: true
                    }]);
                    addLog(`Successfully patched ${targetFile.name}`, 'success');
                } else {
                    const newContent = source.substring(0, matchIdx) + replaceBlock + source.substring(matchIdx + searchBlock.length);
                    setFiles(prev => ({ ...prev, [targetFile.id]: { ...prev[targetFile.id], content: newContent } }));
                    addLog(`Applied file patch to VFS for ${targetFile.name}`, 'success');
                }
                action.applied = true;
            } else {
                addLog(`Structural mismatch: Could not find code block in ${targetFile.name}.`, 'error');
            }
        } else if (action.type === 'create') {
            const data = action.data as FileCreate;
            handleCreateFile(data.path.split('/').pop() || data.path, null, data.content);
            action.applied = true;
        }
    };

    const handleSendMessage = async (text: string, attachments: FileAttachment[]) => {
        const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now(), attachments };
        setMessages(prev => [...prev, userMsg]);
        setIsStreaming(true);
        addLog(`Streaming request to AI pipeline...`, 'info');

        const allModels = [...DEFAULT_MODELS, ...settings.customModels];
        const activeModel = allModels.find(m => m.id === settings.activeModelId) || allModels[0];
        const currentFile = activeFileId ? files[activeFileId] : null;
        
        const workspaceFileList = (Object.values(files) as FileSystemItem[]).map(f => `${f.type === 'folder' ? '[DIR]' : '[FILE]'} ${f.path}`).join('\n');
        let contextStr = `WORKSPACE FILE LIST:\n${workspaceFileList}\n\n`;
        
        if (currentFile && currentFile.type === 'file') {
            const actualContent = editorRef.current && activeFileId === currentFile.id 
                ? editorRef.current.getValue() 
                : (currentFile.content || 'Empty');
            contextStr += `ACTIVE FILE CONTENT (${currentFile.name}):\n${actualContent}\n`;
        }

        const assistantMsgId = (Date.now() + 1).toString();
        let fullResponse = "", fullThought = "";
        setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', thought: '', timestamp: Date.now(), modelName: activeModel.name }]);

        try {
            await streamResponse([...messages, userMsg], settings, activeModel, contextStr, (chunk, thought) => {
                if (chunk) fullResponse += chunk;
                if (thought) fullThought += thought;
                setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: fullResponse, thought: fullThought } : m));
            });

            const detectActions = (content: string): AgentAction[] => {
                const actions: AgentAction[] = [];
                const stripCDATA = (s: string) => {
                    let t = s.trim();
                    if (t.startsWith('<![CDATA[') && t.endsWith(']]>')) {
                        return t.substring(9, t.length - 3);
                    }
                    return t;
                };

                const editRegex = /<edit>[\s\S]*?<path>([\s\S]*?)<\/path>[\s\S]*?<search>([\s\S]*?)<\/search>[\s\S]*?<replace>([\s\S]*?)<\/replace>[\s\S]*?<\/edit>/g;
                let match;
                while ((match = editRegex.exec(content)) !== null) {
                    actions.push({ 
                        type: 'edit', 
                        data: { 
                            filePath: match[1].trim(), 
                            search: stripCDATA(match[2]), 
                            replace: stripCDATA(match[3]), 
                            applied: false 
                        }, 
                        applied: false 
                    });
                }

                const createRegex = /<create>[\s\S]*?<path>([\s\S]*?)<\/path>[\s\S]*?<content>([\s\S]*?)<\/content>[\s\S]*?<\/create>/g;
                while ((match = createRegex.exec(content)) !== null) {
                    actions.push({ 
                        type: 'create', 
                        data: { 
                            path: match[1].trim(), 
                            content: stripCDATA(match[2]) 
                        }, 
                        applied: false 
                    });
                }
                return actions;
            };

            const actions = detectActions(fullResponse);
            if (actions.length > 0) {
                setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, pendingActions: actions } : m));
                addLog(`AI suggested ${actions.length} filesystem modifications`, 'info');
            }
        } catch (error: any) {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', content: `Error: ${error.message}`, timestamp: Date.now() }]);
            addLog(`AI Pipeline Error: ${error.message}`, 'error');
        } finally {
            setIsStreaming(false);
        }
    };

    return (
        <div className="fixed inset-0 grid grid-rows-[44px_1fr_26px] bg-ide-bg text-ide-text overflow-hidden select-none selection:bg-ide-accent/30 font-sans">
            <header className="bg-ide-panel border-b border-ide-border flex items-center justify-between px-5 shadow-sm z-30">
                <div className="flex items-center space-x-8">
                    <span className="font-bold text-ide-accent flex items-center gap-3 text-base uppercase tracking-widest cursor-default">
                        <Icons.Code size={24} strokeWidth={2.5} /> DevMind
                    </span>
                    <div className="flex items-center space-x-3">
                        <select 
                            value={settings.activeProvider}
                            onChange={(e) => setSettings(s => ({ ...s, activeProvider: e.target.value as ProviderType }))}
                            className="bg-ide-activity border border-ide-border rounded-lg px-3 py-1 text-xs font-bold text-ide-text outline-none hover:border-ide-accent transition-all cursor-pointer shadow-sm"
                        >
                            <option value="google">Gemini</option>
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="openrouter">OpenRouter</option>
                        </select>
                        <select 
                            value={settings.activeModelId}
                            onChange={(e) => setSettings(s => ({ ...s, activeModelId: e.target.value }))}
                            className="bg-ide-activity border border-ide-border rounded-lg px-3 py-1 text-xs font-bold text-ide-text outline-none hover:border-ide-accent transition-all cursor-pointer shadow-sm"
                        >
                            {[...DEFAULT_MODELS, ...settings.customModels].filter(m => m.provider === settings.activeProvider).map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center space-x-5">
                    <button onClick={downloadWorkspace} className="p-2 rounded-lg hover:bg-ide-activity transition-all text-gray-400 hover:text-white" title="Export Workspace"><Icons.Upload size={22} strokeWidth={2.5} className="rotate-180" /></button>
                    <button onClick={() => setShowSidebar(!showSidebar)} className={`p-2 rounded-lg hover:bg-ide-activity transition-all text-gray-400 hover:text-white ${!showSidebar && 'opacity-50'}`} title="Sidebar"><Icons.LayoutTemplate size={22} strokeWidth={2.5} /></button>
                    <button onClick={() => setShowChat(!showChat)} className={`p-2 rounded-lg hover:bg-ide-activity transition-all text-gray-400 hover:text-white ${!showChat && 'opacity-50'}`} title="Chat"><Icons.MessageSquare size={22} strokeWidth={2.5} /></button>
                    <div className="h-5 w-[1px] bg-ide-border mx-1"></div>
                    <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-lg hover:bg-ide-activity transition-all text-gray-400 hover:text-white" title="Settings"><Icons.Settings size={22} strokeWidth={2.5} /></button>
                </div>
            </header>

            <main className="flex overflow-hidden relative min-h-0">
                <nav className="w-14 bg-ide-activity flex flex-col items-center py-6 space-y-8 border-r border-ide-border shrink-0 z-20 shadow-xl">
                    <div className={`cursor-pointer p-3 rounded-xl transition-all ${showSidebar ? 'text-ide-accent bg-ide-accent/15 shadow-inner' : 'text-gray-500 hover:text-white hover:bg-ide-panel'}`} onClick={() => setShowSidebar(!showSidebar)}><Icons.Files size={32} strokeWidth={2.5} /></div>
                    <div className="flex-1"></div>
                    <div className="cursor-pointer text-gray-500 hover:text-white p-3 transition-colors" onClick={() => setShowAbout(true)} title="About"><Icons.Info size={32} strokeWidth={2.5} /></div>
                    <div className="cursor-pointer text-gray-500 hover:text-white p-3 mb-2 transition-colors" onClick={() => setSettingsOpen(true)} title="Settings"><Icons.Settings size={32} strokeWidth={2.5} /></div>
                </nav>

                {showSidebar && (
                    <aside className="w-72 flex-shrink-0 border-r border-ide-border min-h-0 flex flex-col bg-ide-sidebar shadow-lg">
                        <Explorer files={files} activeFileId={activeFileId} onFileClick={handleFileClick} onUpload={handleUpload} onDelete={handleDelete} onCreateFile={handleCreateFile} onCreateFolder={handleCreateFolder} onMoveItem={handleMoveItem} onDownloadItem={handleDownloadItem} />
                    </aside>
                )}

                <section className="flex-1 min-w-0 bg-ide-bg relative flex flex-col min-h-0 overflow-hidden">
                    <div className="flex-1 min-h-0 relative">
                        <EditorArea openFiles={openFileIds.map(id => files[id]).filter(Boolean)} activeFileId={activeFileId} settings={settings} onChange={handleEditorChange} onMount={(editor, monaco) => { editorRef.current = editor; monacoRef.current = monaco; }} onTabClick={openFile} onTabClose={closeFile} />
                    </div>
                    <LogStatus logs={logs} isExpanded={isLogsExpanded} onToggle={setIsLogsExpanded} onClear={() => setLogs([])} />
                </section>

                {showChat && (
                    <aside className="w-[420px] flex-shrink-0 border-l border-ide-border shadow-2xl z-20 min-h-0 flex flex-col bg-ide-panel">
                        <ChatPanel messages={messages} onSendMessage={handleSendMessage} onEnhancePrompt={async (t) => enhancePrompt(t, settings, DEFAULT_MODELS[0])} onApplyAction={handleApplyAction} onClearChat={handleClearChat} isStreaming={isStreaming} workspaceFiles={[]} onAttachFile={() => {}} />
                    </aside>
                )}
            </main>

            <footer className="bg-ide-sidebar border-t border-ide-border flex items-center justify-between px-4 text-[11px] font-bold text-gray-500 z-30 overflow-hidden uppercase tracking-wider">
                <div className="flex items-center space-x-5">
                    <button onClick={() => setIsLogsExpanded(!isLogsExpanded)} className="flex items-center hover:text-white transition-colors">
                        <Icons.Terminal size={14} strokeWidth={2.5} className={`mr-2 ${logs.some(l => l.level === 'error') ? 'text-red-500' : 'text-ide-accent'}`}/> 
                        Console {logs.length > 0 && `(${logs.length})`}
                    </button>
                    <div className="h-3 w-[1px] bg-ide-border"></div>
                    <span className="opacity-70">{Object.keys(files).length} STAGED</span>
                </div>
                <div className="flex items-center space-x-5">
                    <span className="bg-ide-activity px-2 py-0.5 rounded border border-ide-border">{settings.theme}</span>
                    <span className="bg-ide-activity px-2 py-0.5 rounded border border-ide-border">{settings.activeModelId}</span>
                    <div className="h-3 w-[1px] bg-ide-border"></div>
                    <span className="text-ide-accent font-black">SAMIR UDDIN AHMED</span>
                </div>
            </footer>

            <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onSave={setSettings} />
            <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
        </div>
    );
}
