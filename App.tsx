
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, FileSystemItem, ChatMessage, FileEdit, SettingsState, FileAttachment, AgentAction, FileCreate, ProviderType, AppTheme, ModelConfig, LogEntry, LogLevel } from './types';
import { Explorer } from './components/Explorer';
import { EditorArea } from './components/Editor';
import { ChatPanel } from './components/Chat';
import { SettingsPanel } from './components/Settings';
import { LogStatus } from './components/LogStatus';
import { AboutModal } from './components/AboutModal';
import { Icons } from './components/Icon';
import { DEFAULT_SETTINGS, DEFAULT_MODELS, THEMES } from './constants';
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
        content: '# 🚀 Welcome to DevMind AI IDE\n\n### Usage Guide:\n1. **AI Assistant**: Use the chat to describe changes. It uses a robust XML protocol.\n2. **Apply Edits**: Click **Apply** on AI suggestions. The engine now uses fuzzy matching to handle formatting differences.\n3. **Explorer**: Use the icons at the top to create files. Naming is inline.\n4. **Download**: Use the download icon in the top header to export your workspace.\n\n### Drag & Drop Support:\n- **External**: Drag files from your computer onto the Explorer to upload them.\n- **Internal**: Drag files or folders into other folders to move them.\n\n### Model Support:\n- **Gemini**: Now with full API key management in Settings.\n- **Visuals**: Upload images/PDFs for visual coding support.' 
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
    
    // Log Status State
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
        
        // Auto-expand on error
        if (level === 'error') {
            setIsLogsExpanded(true);
        }
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
            id, 
            name, 
            path: parent ? `${parent.path}/${name}` : `/${name}`, 
            type: 'file', 
            content, 
            language: name.split('.').pop() || 'plaintext',
            parentId: parentId || null
        };
        setFiles(prev => ({ ...prev, [id]: newFile }));
        addLog(`File created: ${name}`, 'success');
        openFile(id);
    };

    const handleCreateFolder = (name: string, parentId?: string | null) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const parent = parentId ? files[parentId] : null;
        const newFolder: FileSystemItem = { 
            id, 
            name, 
            path: parent ? `${parent.path}/${name}` : `/${name}`, 
            type: 'folder',
            parentId: parentId || null
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
                const newFile: FileSystemItem = {
                    id, name, path: '/' + relativePath, type: 'file', content, mimeType: file.type,
                    language: name.split('.').pop() || 'plaintext'
                };
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
                    if (f.parentId && idsToDelete.has(f.parentId)) {
                        idsToDelete.add(f.id);
                    }
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
            if (!item) return prev;
            if (targetParentId === itemId) return prev;
            let current = targetParentId;
            while (current) {
                if (current === itemId) return prev;
                current = prev[current]?.parentId || null;
            }
            const targetParent = targetParentId ? prev[targetParentId] : null;
            const newPath = targetParent ? `${targetParent.path}/${item.name}` : `/${item.name}`;
            addLog(`Moved ${item.name} to ${targetParent ? targetParent.path : 'root'}`, 'info');
            return {
                ...prev,
                [itemId]: { ...item, parentId: targetParentId, path: newPath }
            };
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
            const searchStr = editData.search;
            const replaceStr = editData.replace;
            const allFiles = Object.values(files) as FileSystemItem[];
            const targetFile = allFiles.find(f => f.path === editData.filePath || f.path === '/' + editData.filePath || f.name === editData.filePath);
            if (!targetFile || !targetFile.content) {
                addLog(`Patch failed: File ${editData.filePath} not found`, 'error');
                return;
            }
            const content = targetFile.content;
            if (content.includes(searchStr)) {
                const newContent = content.replace(searchStr, replaceStr);
                setFiles(prev => ({ ...prev, [targetFile.id]: { ...prev[targetFile.id], content: newContent } }));
                action.applied = true;
                addLog(`Patch applied to ${targetFile.name}`, 'success');
                return;
            }
            const normalize = (s: string) => s.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();
            const normContent = normalize(content);
            const normSearch = normalize(searchStr);
            if (normContent.includes(normSearch)) {
                const trimmedSearch = searchStr.trim();
                const index = content.indexOf(trimmedSearch);
                if (index !== -1) {
                    const newContent = content.substring(0, index) + replaceStr + content.substring(index + trimmedSearch.length);
                    setFiles(prev => ({ ...prev, [targetFile.id]: { ...prev[targetFile.id], content: newContent } }));
                    action.applied = true;
                    addLog(`Fuzzy patch applied to ${targetFile.name}`, 'success');
                    return;
                }
            }
            addLog(`Structural mismatch during patch of ${targetFile.name}`, 'error');
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
            contextStr += `ACTIVE FILE CONTENT (${currentFile.name}):\n${currentFile.content || 'Empty'}\n`;
        }

        const assistantMsgId = (Date.now() + 1).toString();
        let fullResponse = "";
        let fullThought = "";
        setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: '', thought: '', timestamp: Date.now(), modelName: activeModel.name }]);

        try {
            await streamResponse([...messages, userMsg], settings, activeModel, contextStr, (chunk, thought) => {
                if (chunk) fullResponse += chunk;
                if (thought) fullThought += thought;
                setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, content: fullResponse, thought: fullThought } : m));
            });
            
            const detectActions = (content: string): AgentAction[] => {
                const actions: AgentAction[] = [];
                const clean = (s: string) => s.trim().replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
                const editRegex = /<edit>[\s\S]*?<path>([\s\S]*?)<\/path>[\s\S]*?<search>([\s\S]*?)<\/search>[\s\S]*?<replace>([\s\S]*?)<\/replace>[\s\S]*?<\/edit>/g;
                let match;
                while ((match = editRegex.exec(content)) !== null) {
                    actions.push({ type: 'edit', data: { filePath: match[1].trim(), search: clean(match[2]), replace: clean(match[3]), applied: false }, applied: false });
                }
                const createRegex = /<create>[\s\S]*?<path>([\s\S]*?)<\/path>[\s\S]*?<content>([\s\S]*?)<\/content>[\s\S]*?<\/create>/g;
                while ((match = createRegex.exec(content)) !== null) {
                    actions.push({ type: 'create', data: { path: match[1].trim(), content: clean(match[2]) }, applied: false });
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

    const combinedModels = [...DEFAULT_MODELS, ...settings.customModels];

    return (
        <div className="flex flex-col h-screen w-screen bg-ide-bg text-ide-text transition-colors duration-200 overflow-hidden relative">
            <div className="h-10 bg-ide-panel border-b border-ide-border flex items-center justify-between px-4 shrink-0 shadow-sm z-20">
                <div className="flex items-center space-x-6">
                    <span className="font-bold text-ide-accent flex items-center gap-2 text-sm uppercase tracking-wider select-none cursor-default">
                        <Icons.Code size={20} /> DevMind
                    </span>
                    <div className="flex items-center space-x-2">
                        <select 
                            value={settings.activeProvider}
                            onChange={(e) => setSettings(s => ({ ...s, activeProvider: e.target.value as ProviderType }))}
                            className="bg-ide-activity border border-ide-border rounded px-2 py-0.5 text-[11px] font-medium text-ide-text outline-none hover:border-ide-accent transition-colors cursor-pointer"
                        >
                            <option value="google">Gemini</option>
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic</option>
                            <option value="openrouter">OpenRouter</option>
                            <option value="local">Local</option>
                        </select>
                        <select 
                            value={settings.activeModelId}
                            onChange={(e) => setSettings(s => ({ ...s, activeModelId: e.target.value }))}
                            className="bg-ide-activity border border-ide-border rounded px-2 py-0.5 text-[11px] font-medium text-ide-text outline-none hover:border-ide-accent transition-colors cursor-pointer"
                        >
                            {combinedModels.filter(m => m.provider === settings.activeProvider).map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={downloadWorkspace} className="p-1.5 rounded hover:bg-ide-activity transition-colors" title="Export Full Workspace"><Icons.Upload size={16} className="rotate-180" /></button>
                    <button onClick={() => setShowSidebar(!showSidebar)} className={`p-1.5 rounded hover:bg-ide-activity transition-colors ${!showSidebar && 'opacity-50'}`} title="Toggle Sidebar"><Icons.LayoutTemplate size={16} /></button>
                    <button onClick={() => setShowChat(!showChat)} className={`p-1.5 rounded hover:bg-ide-activity transition-colors ${!showChat && 'opacity-50'}`} title="Toggle Chat"><Icons.MessageSquare size={16} /></button>
                    <div className="h-4 w-[1px] bg-ide-border"></div>
                    <button onClick={() => setSettingsOpen(true)} className="p-1.5 rounded hover:bg-ide-activity transition-colors" title="IDE Settings"><Icons.Settings size={16} /></button>
                </div>
            </div>
            <div className="flex-1 flex overflow-hidden relative">
                <div className="w-12 bg-ide-activity flex flex-col items-center py-4 space-y-6 border-r border-ide-border shrink-0 z-10 shadow-lg">
                    <div className={`cursor-pointer p-2 rounded-lg transition-all ${showSidebar ? 'text-ide-accent bg-ide-accent/10 shadow-inner' : 'text-gray-500 hover:text-white hover:bg-ide-panel'}`} onClick={() => setShowSidebar(!showSidebar)}><Icons.Files size={24} /></div>
                    <div className="flex-1"></div>
                    <div className="cursor-pointer text-gray-500 hover:text-white p-2" onClick={() => setShowAbout(true)} title="About DevMind"><Icons.Info size={24} /></div>
                    <div className="cursor-pointer text-gray-500 hover:text-white p-2 mb-2" onClick={() => setSettingsOpen(true)} title="Settings"><Icons.Settings size={24} /></div>
                </div>
                {showSidebar && (
                    <div className="w-64 flex-shrink-0 animate-in slide-in-from-left duration-200 border-r border-ide-border">
                        <Explorer files={files} activeFileId={activeFileId} onFileClick={handleFileClick} onUpload={handleUpload} onDelete={handleDelete} onCreateFile={handleCreateFile} onCreateFolder={handleCreateFolder} onMoveItem={handleMoveItem} onDownloadItem={handleDownloadItem} />
                    </div>
                )}
                <div className="flex-1 min-w-0 bg-ide-bg relative flex flex-col">
                    <EditorArea openFiles={openFileIds.map(id => files[id]).filter(Boolean)} activeFileId={activeFileId} settings={settings} onChange={handleEditorChange} onMount={(editor, monaco) => { editorRef.current = editor; monacoRef.current = monaco; }} onTabClick={openFile} onTabClose={closeFile} />
                    
                    {/* Log Status Component Integrated Here */}
                    <LogStatus logs={logs} isExpanded={isLogsExpanded} onToggle={setIsLogsExpanded} onClear={() => setLogs([])} />
                </div>
                {showChat && (
                    <div className="w-96 flex-shrink-0 border-l border-ide-border shadow-2xl z-10 animate-in slide-in-from-right duration-200">
                        <ChatPanel messages={messages} onSendMessage={handleSendMessage} onEnhancePrompt={async (t) => enhancePrompt(t, settings, combinedModels[0])} onApplyAction={handleApplyAction} onClearChat={handleClearChat} isStreaming={isStreaming} workspaceFiles={[]} onAttachFile={() => {}} />
                    </div>
                )}
            </div>
            <div className="h-6 bg-ide-sidebar border-t border-ide-border flex items-center justify-between px-3 text-[10px] font-medium text-gray-500 shrink-0 select-none">
                <div className="flex items-center space-x-4">
                    <span className="flex items-center cursor-pointer hover:text-white transition-colors" onClick={() => setIsLogsExpanded(!isLogsExpanded)}>
                        <Icons.Terminal size={10} className={`mr-1.5 ${logs.some(l => l.level === 'error') ? 'text-red-500' : 'text-ide-accent'}`}/> 
                        Console {logs.length > 0 && `(${logs.filter(l => l.level === 'error').length} errors)`}
                    </span>
                    <span className="opacity-70">{Object.keys(files).length} objects in workspace</span>
                </div>
                <div className="flex items-center space-x-4 uppercase tracking-tighter">
                    <span className="bg-ide-activity px-1.5 py-0.5 rounded border border-ide-border">{settings.theme}</span>
                    <span className="bg-ide-activity px-1.5 py-0.5 rounded border border-ide-border">{settings.activeModelId}</span>
                    <span className="opacity-70">Developed by Samir Uddin Ahmed</span>
                </div>
            </div>
            <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} onSave={setSettings} />
            <AboutModal isOpen={showAbout} onClose={() => setShowAbout(false)} />
        </div>
    );
}
