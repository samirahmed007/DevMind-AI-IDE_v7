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
        <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4 backdrop-blur-lg animate-in fade-in duration-300">
            <div className="bg-ide-panel border border-ide-border w-full max-w-4xl rounded-[32px] shadow-2xl flex flex-col h-[85vh] overflow-hidden">
                <div className="flex items-center justify-between px-8 py-6 border-b border-ide-border bg-ide-sidebar/50 shrink-0">
                    <div className="flex items-center space-x-4">
                        <Icons.Settings className="text-ide-accent" size={24} strokeWidth={2.5} />
                        <h2 className="text-base font-black uppercase tracking-[0.2em] text-white">Project Config</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all"><Icons.X size={24} strokeWidth={2.5} /></button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="w-64 border-r border-ide-border bg-ide-sidebar/20 p-6 space-y-3">
                        <p className="text-[10px] font-black text-gray-500 uppercase px-2 mb-4 tracking-[0.3em] opacity-60">Configuration</p>
                        {[
                            { id: 'general', name: 'UI & Interface', icon: Icons.Monitor },
                            { id: 'ai', name: 'Neural Models', icon: Icons.Brain },
                            { id: 'endpoints', name: 'API Pipelines', icon: Icons.Code },
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id as any)}
                                className={`w-full flex items-center px-5 py-4 text-[13px] font-black uppercase tracking-widest rounded-2xl transition-all ${activeSection === tab.id ? 'bg-ide-accent text-white shadow-lg' : 'text-gray-500 hover:bg-ide-activity hover:text-white'}`}
                            >
                                <tab.icon size={20} strokeWidth={2.5} className="mr-4" />
                                {tab.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 p-12 overflow-y-auto no-scrollbar space-y-12 bg-ide-bg/10">
                        {activeSection === 'general' && (
                            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-300">
                                <section className="space-y-8">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center">
                                        <div className="w-2 h-4 bg-ide-accent mr-4 rounded-full"></div>
                                        Display Parameters
                                    </h3>
                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-3">
                                            <label className="text-[11px] text-gray-500 uppercase font-black tracking-widest">Active Skin</label>
                                            <select value={localSettings.theme} onChange={(e) => handleChange('theme', e.target.value as AppTheme)}
                                                className="w-full bg-ide-activity border border-ide-border rounded-xl p-4 text-sm font-bold text-white focus:ring-2 ring-ide-accent outline-none appearance-none cursor-pointer">
                                                {THEMES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] text-gray-500 uppercase font-black tracking-widest">Editor Font (px)</label>
                                            <input type="number" value={localSettings.editorFontSize} onChange={(e) => handleChange('editorFontSize', parseInt(e.target.value) || 14)}
                                                className="w-full bg-ide-activity border border-ide-border rounded-xl p-4 text-sm font-bold text-white focus:ring-2 ring-ide-accent outline-none" />
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeSection === 'ai' && (
                            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-300">
                                <section className="space-y-8">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center">
                                        <div className="w-2 h-4 bg-ide-accent mr-4 rounded-full"></div>
                                        Neural Inventory
                                    </h3>
                                    <div className="grid grid-cols-1 gap-4 max-h-[350px] overflow-y-auto pr-3 no-scrollbar">
                                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 mb-4">
                                            <p className="text-[10px] text-gray-500 font-black mb-4 uppercase tracking-[0.2em]">Core Intelligence</p>
                                            <div className="flex flex-wrap gap-3">
                                                {DEFAULT_MODELS.map(m => (
                                                    <span key={m.id} className="px-3 py-2 bg-ide-activity rounded-xl text-[11px] border border-ide-border text-gray-400 font-bold">
                                                        {m.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        {localSettings.customModels.length > 0 && (
                                            <div className="bg-ide-accent/5 p-6 rounded-3xl border border-ide-accent/10">
                                                <p className="text-[10px] text-ide-accent font-black mb-4 uppercase tracking-[0.2em]">Registered Extensions</p>
                                                {localSettings.customModels.map(model => (
                                                    <div key={model.id} className="flex items-center justify-between p-4 bg-ide-activity/50 rounded-2xl border border-white/5 group mb-3 last:mb-0">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-black text-white">{model.name}</span>
                                                            <span className="text-[10px] text-gray-500 uppercase font-bold">{model.provider} • {model.id}</span>
                                                        </div>
                                                        <button onClick={() => handleRemoveCustomModel(model.id)} className="text-gray-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Icons.Trash2 size={20} strokeWidth={2.5} />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </section>

                                <section className="p-8 bg-ide-panel/50 border border-ide-border rounded-3xl space-y-8">
                                    <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Register New Neural Target</h4>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Public Alias</label>
                                            <input placeholder="e.g. My Custom GPT" value={newModel.name || ''} onChange={e => setNewModel({...newModel, name: e.target.value})} className="w-full bg-ide-activity border border-ide-border rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-ide-accent" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">System Identifier</label>
                                            <input placeholder="e.g. gpt-4-32k" value={newModel.id || ''} onChange={e => setNewModel({...newModel, id: e.target.value})} className="w-full bg-ide-activity border border-ide-border rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-ide-accent" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Pipeline Provider</label>
                                            <select value={newModel.provider} onChange={e => setNewModel({...newModel, provider: e.target.value as ProviderType})} className="w-full bg-ide-activity border border-ide-border rounded-xl p-4 text-xs font-bold text-white outline-none cursor-pointer">
                                                <option value="google">Google Gemini</option>
                                                <option value="openai">OpenAI</option>
                                                <option value="anthropic">Anthropic</option>
                                                <option value="openrouter">OpenRouter</option>
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <button onClick={handleAddCustomModel} className="w-full bg-ide-accent text-white rounded-xl p-4 text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95">
                                                <Icons.Plus size={18} strokeWidth={2.5} className="inline mr-3" /> Add Model
                                            </button>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeSection === 'endpoints' && (
                            <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-300">
                                <section className="space-y-10">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] flex items-center">
                                        <div className="w-2 h-4 bg-ide-accent mr-4 rounded-full"></div>
                                        Secure API Pipelines
                                    </h3>
                                    <div className="grid grid-cols-1 gap-8">
                                        {[
                                            { id: 'google', name: 'Google Gemini' },
                                            { id: 'openai', name: 'OpenAI Direct' },
                                            { id: 'anthropic', name: 'Anthropic' },
                                            { id: 'openrouter', name: 'OpenRouter' },
                                        ].map(prov => (
                                            <div key={prov.id} className="p-8 bg-ide-sidebar/60 border border-ide-border rounded-3xl space-y-6 transition-all hover:border-ide-accent/40 group">
                                                <div className="flex items-center text-[12px] font-black text-gray-300 uppercase tracking-widest">
                                                    <span className="w-2 h-2 rounded-full mr-4 bg-ide-accent"></span>
                                                    {prov.name} Auth
                                                </div>
                                                <div className="grid grid-cols-2 gap-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">API Endpoint</label>
                                                        <input 
                                                            type="text" 
                                                            value={localSettings.customEndpoints[prov.id as ProviderType]} 
                                                            onChange={(e) => handleEndpointChange(prov.id as ProviderType, e.target.value)}
                                                            className="w-full bg-ide-activity border border-ide-border rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-2 ring-ide-accent/20" 
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Authentication Key</label>
                                                        <input 
                                                            type="password" 
                                                            value={localSettings.apiKeys[prov.id as ProviderType]} 
                                                            onChange={(e) => handleApiKeyChange(prov.id as ProviderType, e.target.value)}
                                                            placeholder="••••••••••••••••"
                                                            className="w-full bg-ide-activity border border-ide-border rounded-xl p-4 text-sm font-bold text-white outline-none focus:ring-2 ring-ide-accent/20" 
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

                <div className="p-8 border-t border-ide-border flex justify-end space-x-6 bg-ide-sidebar/50 shrink-0">
                    <button onClick={onClose} className="px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">Discard</button>
                    <button onClick={() => { onSave(localSettings); onClose(); }}
                        className="px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest bg-ide-accent hover:bg-blue-600 text-white transition-all flex items-center shadow-2xl active:scale-95">
                        <Icons.Save size={18} strokeWidth={2.5} className="mr-3" /> Commit Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
