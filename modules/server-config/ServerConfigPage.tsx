import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { getServers, addServer, updateServer, deleteServer, Server, testServerConnection, updateServerTestResult } from '../../config/serverConfig';

// --- ICONS ---
const PlusIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
const TrashIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const InfoIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;


const ServerModal = ({ server, onClose, onSave }: { server: Partial<Server> | null, onClose: () => void, onSave: (server: Server | Omit<Server, 'id'>) => void }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ 
        name: '', 
        url: '', 
        enabled: true,
        auth: { type: 'none' as const },
        mqtt: { port: 1883, useSSL: false, wsPort: 9001, wsPath: '/mqtt' },
        ...server 
    });
    const isEditing = !!formData.id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        if (name.includes('.')) {
            const [section, field] = name.split('.');
            setFormData(prev => ({ 
                ...prev, 
                [section]: { 
                    ...prev[section as keyof typeof prev], 
                    [field]: type === 'checkbox' ? checked : value 
                } 
            }));
        } else {
            setFormData(prev => ({ 
                ...prev, 
                [name]: type === 'checkbox' ? checked : value 
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl m-4" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold">{isEditing ? t('server_config_modal_edit_title') : t('server_config_modal_add_title')}</h3>
                    </div>
                    <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('server_config_modal_name')}</label>
                            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('server_config_modal_url')}</label>
                            <input type="url" name="url" id="url" value={formData.url} onChange={handleChange} required placeholder="http://192.168.1.10:5000" className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                        </div>

                        <div class="pt-2">
                            <div className="flex items-center">
                                <input type="checkbox" name="enabled" id="enabled" checked={formData.enabled} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 bg-gray-50 dark:bg-gray-700 focus:ring-primary-500" />
                                <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">{t('server_config_modal_enabled')}</label>
                            </div>
                        </div>
                        
                        <div>
                            <label htmlFor="auth.type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Authentication Type</label>
                            <select name="auth.type" id="auth.type" value={formData.auth?.type || 'none'} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500">
                                <option value="none">No Authentication</option>
                                <option value="basic">Basic Auth</option>
                                <option value="token">Bearer Token</option>
                                <option value="frigate">Frigate (Cookie-based)</option>
                            </select>
                        </div>
                        
                        {(formData.auth?.type === 'basic' || formData.auth?.type === 'frigate') && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="auth.username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                                    <input type="text" name="auth.username" id="auth.username" value={formData.auth?.username || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label htmlFor="auth.password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                    <input type="password" name="auth.password" id="auth.password" value={formData.auth?.password || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                            </div>
                        )}
                        
                        {formData.auth?.type === 'token' && (
                            <div>
                                <label htmlFor="auth.token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bearer Token</label>
                                <input type="password" name="auth.token" id="auth.token" value={formData.auth?.token || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                            </div>
                        )}
                        
                        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200">MQTT Configuration</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div>
                                    <label htmlFor="mqtt.host" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Host</label>
                                    <input type="text" name="mqtt.host" id="mqtt.host" value={formData.mqtt?.host || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label htmlFor="mqtt.port" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Port</label>
                                    <input type="number" name="mqtt.port" id="mqtt.port" value={formData.mqtt?.port || 1883} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label htmlFor="mqtt.user" className="block text-sm font-medium text-gray-700 dark:text-gray-300">MQTT User</label>
                                    <input type="text" name="mqtt.user" id="mqtt.user" value={formData.mqtt?.user || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label htmlFor="mqtt.password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">MQTT Password</label>
                                    <input type="password" name="mqtt.password" id="mqtt.password" value={formData.mqtt?.password || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label htmlFor="mqtt.wsPort" className="block text-sm font-medium text-gray-700 dark:text-gray-300">WebSocket Port</label>
                                    <input type="number" name="mqtt.wsPort" id="mqtt.wsPort" value={formData.mqtt?.wsPort || 9001} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label htmlFor="mqtt.wsPath" className="block text-sm font-medium text-gray-700 dark:text-gray-300">WebSocket Path</label>
                                    <input type="text" name="mqtt.wsPath" id="mqtt.wsPath" value={formData.mqtt?.wsPath || '/mqtt'} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                            </div>
                            <div className="mt-2">
                                <div className="flex items-center">
                                    <input type="checkbox" name="mqtt.useSSL" id="mqtt.useSSL" checked={formData.mqtt?.useSSL || false} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 bg-gray-50 dark:bg-gray-700 focus:ring-primary-500" />
                                    <label htmlFor="mqtt.useSSL" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">Use SSL for MQTT</label>
                                </div>
                            </div>
                        </div>
                        

                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500">{t('server_config_modal_cancel')}</button>
                        <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700">{t('server_config_modal_save')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ServerConfigPage = () => {
    const { t } = useTranslation();
    const [servers, setServers] = useState<Server[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingServer, setEditingServer] = useState<Partial<Server> | null>(null);
    const [testing, setTesting] = useState<Record<string, boolean>>({});

    const loadServers = useCallback(async () => {
        setIsLoading(true);
        const serverList = await getServers();
        setServers(serverList);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadServers();
    }, [loadServers]);

    const handleOpenModal = (server: Partial<Server> | null = null) => {
        setEditingServer(server);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingServer(null);
    };

    const handleSave = async (serverData: Server | Omit<Server, 'id'>) => {
        if ('id' in serverData) {
            await updateServer(serverData as Server);
        } else {
            await addServer(serverData);
        }
        await loadServers();
        handleCloseModal();
    };

    const handleDelete = async (serverId: string) => {
        if (window.confirm(t('server_config_modal_delete_confirm'))) {
            await deleteServer(serverId);
            await loadServers();
        }
    };

    const testServer = async (s: Server) => {
        setTesting(prev => ({ ...prev, [s.id]: true }));

        try {
            const result = await testServerConnection(s);
            await updateServerTestResult(s.id, result.success ? 'success' : 'error', result.message, result.responseTime);

            setServers(prevServers => prevServers.map(serverInState => {
                if (serverInState.id === s.id) {
                    return {
                        ...serverInState,
                        lastTest: {
                            timestamp: Date.now(),
                            result: result.success ? 'success' : 'error',
                            message: result.message,
                            responseTime: result.responseTime,
                        },
                        status: result.success ? 'online' : 'offline',
                    };
                }
                return serverInState;
            }));

            window.alert(`${result.success ? '✅' : '❌'} ${result.message}`);

        } catch (error: any) {
            const errorMessage = error?.message || 'Unknown error';
            await updateServerTestResult(s.id, 'error', errorMessage);

            setServers(prevServers => prevServers.map(serverInState => {
                if (serverInState.id === s.id) {
                    return {
                        ...serverInState,
                        lastTest: {
                            timestamp: Date.now(),
                            result: 'error',
                            message: errorMessage,
                        },
                        status: 'offline',
                    };
                }
                return serverInState;
            }));

            window.alert(`❌ Test failed: ${errorMessage}`);
        } finally {
            setTesting(prev => ({ ...prev, [s.id]: false }));
        }
    };

    const testMqtt = async (s: Server) => {
        setTesting(prev => ({ ...prev, [s.id]: true }));
        try {
            // Derive MQTT WS URL from new structure
            const baseUrl = new URL(s.url);
            const host = s.mqtt?.host || baseUrl.hostname;
            const useSSL = s.mqtt?.useSSL || baseUrl.protocol === 'https:';
            const port = s.mqtt?.wsPort ?? (useSSL ? 8083 : 9001);
            const path = s.mqtt?.wsPath || '/mqtt';
            const wsUrl = `${useSSL ? 'wss' : 'ws'}://${host}:${port}${path}`;

            await new Promise<void>((resolve, reject) => {
                const ws = new WebSocket(wsUrl);
                const timeout = setTimeout(() => {
                    try { ws.close(); } catch {}
                    reject(new Error('MQTT WS timeout'));
                }, 5000);
                ws.onopen = () => {
                    clearTimeout(timeout);
                    try { ws.close(); } catch {}
                    resolve();
                };
                ws.onerror = (ev) => {
                    clearTimeout(timeout);
                    reject(new Error('MQTT WS error'));
                };
            });
            window.alert('✅ MQTT test OK');
        } catch (e: any) {
            window.alert(`❌ MQTT test FAILED: ${e?.message || e}`);
        } finally {
            setTesting(prev => ({ ...prev, [s.id]: false }));
        }
    };
    
    return (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold">
                    <PlusIcon className="w-5 h-5" />
                    {t('server_config_add')}
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('server_config_table_name')}</th>
                            <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('server_config_table_url')}</th>
                            <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('server_config_table_status')}</th>
                            <th className="py-3 px-6 text-right font-semibold text-gray-600 dark:text-gray-300">{t('server_config_table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr><td colSpan={4} className="text-center py-8">{t('status_checking')}</td></tr>
                        ) : servers.map(server => (
                            <tr key={server.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-4 px-6 font-medium">{server.name}</td>
                                <td className="py-4 px-6 text-gray-500 dark:text-gray-400 font-mono">{server.url}</td>
                                <td className="py-4 px-6">
                                    {server.enabled ? (
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Enabled</span>
                                    ) : (
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Disabled</span>
                                    )}
                                    {server.lastTest && (
                                        <div className="mt-1 text-xs">
                                            <span className={`font-medium ${server.lastTest.result === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                                                {server.lastTest.result === 'success' ? '✅' : '❌'} 
                                                {server.lastTest.responseTime && ` (${server.lastTest.responseTime}ms)`}
                                            </span>
                                            <div className="text-gray-500 dark:text-gray-400 truncate max-w-xs" title={server.lastTest.message}>
                                                {server.lastTest.message}
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 px-6 text-right space-x-2">
                                    <button onClick={() => testServer(server)} disabled={!!testing[server.id]} className="px-2 py-1 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-50">{testing[server.id] ? 'Testing...' : 'Test Server'}</button>
                                    <button onClick={() => testMqtt(server)} disabled={!!testing[server.id]} className="px-2 py-1 rounded-md bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-50">{testing[server.id] ? 'Testing...' : 'Test MQTT'}</button>
                                    <button onClick={() => handleOpenModal(server)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"><EditIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(server.id)} className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {modalOpen && <ServerModal server={editingServer} onClose={handleCloseModal} onSave={handleSave} />}
        </div>
    );
};

export default ServerConfigPage;
