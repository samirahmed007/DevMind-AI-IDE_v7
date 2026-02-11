import React, { useState } from 'react';
import { SettingsState, ProviderType, AppTheme, ModelConfig } from '../types';
import { Icons } from './Icon';
import { THEMES, DEFAULT_MODELS } from '../constants';

interface SettingsProps {
    isOpen: boolean;
    onClose: () => void;
    settings: SettingsState;
    onSave: (newSettings: SettingsState) => void;
}

export const SettingsPanel: React.FC<SettingsProps> = ({ isOpen, onClose, settings, onSave }) => {
    const [localSettings, setLocalSettings] = useState<SettingsState>(settings);
    const [activeSection, setActiveSection] = useState<'general' | 'ai' | 'endpoints'>('general');
    const [newModel, setNewModel] = useState<Partial<ModelConfig>>({ provider: 'google', vision: false });

    if (!isOpen) return null;

    const handleChange = (key: keyof SettingsState, value: any) => {
        setLocalSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleApiKeyChange = (provider: ProviderType, value: string) => {
        setLocalSettings(prev => ({ ...prev, apiKeys: { ...prev.apiKeys, [provider]: value } }));
    };

    const handleEndpointChange = (provider: ProviderType, value: string) => {
        setLocalSettings(prev => ({ ...prev, customEndpoints: { ...prev.customEndpoints, [provider]: value } }));
    };

    const handleAddCustomModel = () => {
        if (!newModel.id || !newModel.name || !newModel.provider) return;
        const model: ModelConfig = {
            id: newModel.id,
            name: newModel.name,
            provider: newModel.provider as ProviderType,
            contextWindow: 128000,
            vision: !!newModel.vision
        };
        setLocalSettings(prev => ({ ...prev, customModels: [...prev.customModels, model] }));
        setNewModel({ provider: 'google', vision: false, name: '', id: '' });
    };

    const handleRemoveCustomModel = (id: string) => {
        setLocalSettings(prev => ({ ...prev, customModels: prev.customModels.filter(m => m.id !== id) }));
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-ide-panel border border-ide-border w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-ide-border bg-ide-sidebar shrink-0">
                    <div className="flex items-center space-x-2">
                        <Icons.Settings className="text-ide-accent" size={20} />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-white">System Configuration</h2>
                    </div>
                    <button onClick={onClose} className="hover:text-white p-1 text-gray-500 transition-colors"><Icons.X size={20} /></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-56 border-r border-ide-border bg-ide-sidebar/40 p-4 space-y-2">
                        <p className="text-[10px] font-bold text-gray-500 uppercase px-2 mb-4 tracking-tighter">Menu</p>
                        {[
                            { id: 'general', name: 'General & UI', icon: Icons.Monitor },
                            { id: 'ai', name: 'Model Management', icon: Icons.Wand2 },
                            { id: 'endpoints', name: 'API & Providers', icon: Icons.Code },
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id as any)}
                                className={`w-full flex items-center px-4 py-3 text-xs font-semibold rounded-xl transition-all ${activeSection === tab.id ? 'bg-ide-accent text-white shadow-lg' : 'text-gray-400 hover:bg-ide-activity hover:text-white'}`}
                            >
                                <tab.icon size={16} className="mr-3" />
                                {tab.name}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-10 overflow-y-auto no-scrollbar space-y-12 bg-ide-bg/30">
                        {activeSection === 'general' && (
                            <div className="space-y-10">
                                <section className="space-y-6">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                        <div className="w-1 h-3 bg-ide-accent mr-3 rounded-full"></div>
                                        Interface Appearance
                                    </h3>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Active Theme</label>
                                            <select value={localSettings.theme} onChange={(e) => handleChange('theme', e.target.value as AppTheme)}
                                                className="w-full bg-ide-activity border border-ide-border rounded-xl p-3 text-sm text-white focus:ring-2 ring-ide-accent outline-none appearance-none">
                                                {THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-tight">Editor Font (px)</label>
                                            <input type="number" value={localSettings.editorFontSize} onChange={(e) => handleChange('editorFontSize', parseInt(e.target.value) || 14)}
                                                className="w-full bg-ide-activity border border-ide-border rounded-xl p-3 text-sm text-white focus:ring-2 ring-ide-accent outline-none" />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeSection === 'ai' && (
                            <div className="space-y-10">
                                <section className="space-y-6">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                        <div className="w-1 h-3 bg-ide-accent mr-3 rounded-full"></div>
                                        Active Model Inventory
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-3 no-scrollbar">
                                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-2">
                                            <p className="text-[9px] text-gray-500 font-bold mb-3 uppercase tracking-widest">Built-in Intelligence</p>
                                            <div className="flex flex-wrap gap-2">
                                                {DEFAULT_MODELS.map(m => (
                                                    <span key={m.id} className="px-2 py-1 bg-ide-activity rounded-lg text-[10px] border border-ide-border text-gray-400">
                                                        {m.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {localSettings.customModels.length > 0 && (
                                            <div className="bg-ide-accent/5 p-4 rounded-2xl border border-ide-accent/10">
                                                <p className="text-[9px] text-ide-accent font-bold mb-3 uppercase tracking-widest">Custom Extensions</p>
                                                {localSettings.customModels.map(model => (
                                                    <div key={model.id} className="flex items-center justify-between p-3 bg-ide-activity/50 rounded-xl border border-white/5 group mb-2 last:mb-0">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-white">{model.name}</span>
                                                            <span className="text-[9px] text-gray-500 uppercase">{model.provider} • {model.id}</span>
                                                        </div>
                                                        <button onClick={() => handleRemoveCustomModel(model.id)} className="text-gray-500 hover:text-red-400 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Icons.Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="p-6 bg-ide-panel/50 border border-ide-border rounded-2xl space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Register New Model</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-gray-500 font-bold">Public Name</label>
                                            <input placeholder="e.g. My Custom GPT" value={newModel.name || ''} onChange={e => setNewModel({...newModel, name: e.target.value})} className="w-full bg-ide-activity border border-ide-border rounded-xl p-3 text-xs text-white outline-none focus:border-ide-accent" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-gray-500 font-bold">System ID</label>
                                            <input placeholder="e.g. gpt-4-32k" value={newModel.id || ''} onChange={e => setNewModel({...newModel, id: e.target.value})} className="w-full bg-ide-activity border border-ide-border rounded-xl p-3 text-xs text-white outline-none focus:border-ide-accent" />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] text-gray-500 font-bold">Provider Pipeline</label>
                                            <select value={newModel.provider} onChange={e => setNewModel({...newModel, provider: e.target.value as ProviderType})} className="w-full bg-ide-activity border border-ide-border rounded-xl p-3 text-xs text-white outline-none">
                                                <option value="google">Google Gemini</option>
                                                <option value="openai">OpenAI</option>
                                                <option value="anthropic">Anthropic</option>
                                                <option value="openrouter">OpenRouter</option>
                                                <option value="local">Local (Ollama/LLM)</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <button onClick={handleAddCustomModel} className="w-full bg-ide-accent text-white rounded-xl p-3 text-xs font-bold hover:brightness-110 transition-all shadow-xl active:scale-95">
                                                <Icons.Plus size={14} className="inline mr-2" /> Add Model
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeSection === 'endpoints' && (
                            <div className="space-y-10">
                                <section className="space-y-8">
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                                        <div className="w-1 h-3 bg-ide-accent mr-3 rounded-full"></div>
                                        API Pipeline Connections
                                    </h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        {[
                                            { id: 'google', name: 'Google Gemini' },
                                            { id: 'openai', name: 'OpenAI Direct' },
                                            { id: 'anthropic', name: 'Anthropic' },
                                            { id: 'openrouter', name: 'OpenRouter' },
                                            { id: 'local', name: 'Local (Ollama/LMStudio)' },
                                        ].map(prov => (
                                            <div key={prov.id} className="p-6 bg-ide-sidebar/60 border border-ide-border rounded-2xl space-y-4 transition-all hover:border-ide-accent/50 group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center text-[11px] font-bold text-gray-300 uppercase tracking-tighter">
                                                        <span className="w-2 h-2 rounded-full mr-3 bg-ide-accent"></span>
                                                        {prov.name} Configuration
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] text-gray-500 uppercase font-bold">API Base Endpoint</label>
                                                        <input 
                                                            type="text" 
                                                            value={localSettings.customEndpoints[prov.id as ProviderType]} 
                                                            onChange={(e) => handleEndpointChange(prov.id as ProviderType, e.target.value)}
                                                            className="w-full bg-ide-activity border border-ide-border rounded-xl p-2.5 text-xs text-white outline-none focus:ring-1 ring-ide-accent" 
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] text-gray-500 uppercase font-bold">Authentication Key</label>
                                                        <input 
                                                            type="password" 
                                                            value={localSettings.apiKeys[prov.id as ProviderType]} 
                                                            onChange={(e) => handleApiKeyChange(prov.id as ProviderType, e.target.value)}
                                                            placeholder="Enter Key..."
                                                            className="w-full bg-ide-activity border border-ide-border rounded-xl p-2.5 text-xs text-white outline-none focus:ring-1 ring-ide-accent" 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-ide-border flex justify-end space-x-4 bg-ide-sidebar shrink-0">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl text-xs font-bold text-gray-400 hover:bg-ide-activity hover:text-white transition-all">Discard</button>
                    <button onClick={() => { onSave(localSettings); onClose(); }}
                        className="px-8 py-2.5 rounded-xl text-xs font-bold bg-ide-accent hover:bg-blue-600 text-white transition-all flex items-center shadow-2xl active:scale-95">
                        <Icons.Save size={16} className="mr-2" /> Commit Changes
                    </button>
                </div>
            </div>
        </div>
    );
};