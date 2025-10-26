import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { getServers, addServer, updateServer, deleteServer, Server } from '../../config/serverConfig';
import ServerStatus from './ServerStatus';
import { fetchServerStatus, ServerStatus as Status } from '../../api/serverStatus';

// --- ICONS ---
const PlusIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
const TrashIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const InfoIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>;


const ServerModal = ({ server, onClose, onSave }: { server: Partial<Server> | null, onClose: () => void, onSave: (server: Server | Omit<Server, 'id'>) => void }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ name: '', url: '', token: '', enabled: true, mqttHost: '', mqttPort: 1883, mqttUser: '', mqttPassword: '', ...server });
    const isEditing = !!formData.id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
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
                         <div className="flex items-center">
                            <input type="checkbox" name="enabled" id="enabled" checked={formData.enabled} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 bg-gray-50 dark:bg-gray-700 focus:ring-primary-500" />
                            <label htmlFor="enabled" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">{t('server_config_modal_enabled')}</label>
                        </div>
                        
                        <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                           <h4 className="font-semibold text-gray-800 dark:text-gray-200">{t('server_config_mqtt_title')}</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                <div>
                                    <label htmlFor="mqttHost" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('server_config_mqtt_host')}</label>
                                    <input type="text" name="mqttHost" id="mqttHost" value={formData.mqttHost || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label htmlFor="mqttPort" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('server_config_mqtt_port')}</label>
                                    <input type="number" name="mqttPort" id="mqttPort" value={formData.mqttPort || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label htmlFor="mqttUser" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('server_config_mqtt_user')}</label>
                                    <input type="text" name="mqttUser" id="mqttUser" value={formData.mqttUser || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                                <div>
                                    <label htmlFor="mqttPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('server_config_mqtt_password')}</label>
                                    <input type="password" name="mqttPassword" id="mqttPassword" value={formData.mqttPassword || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                                </div>
                           </div>
                        </div>

                        <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900/50 rounded-lg">
                            <h4 className="font-semibold flex items-center gap-2"><InfoIcon className="w-5 h-5 text-primary-500"/>{t('server_config_modal_token_help_title')}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{t('server_config_modal_token_help_intro')}</p>
                             <div className="mt-2">
                                <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('server_config_modal_token')}</label>
                                <input type="password" name="token" id="token" value={formData.token || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
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


const ServersTab = () => {
    const { t } = useTranslation();
    const [servers, setServers] = useState<Server[]>([]);
    const [statuses, setStatuses] = useState<Record<string, Status>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingServer, setEditingServer] = useState<Partial<Server> | null>(null);

    const loadServers = useCallback(async () => {
        setIsLoading(true);
        const serverList = await getServers();
        setServers(serverList);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        loadServers();
    }, [loadServers]);
    
    useEffect(() => {
        const fetchAllStatuses = async () => {
            const enabledServers = servers.filter(s => s.enabled);
            if (enabledServers.length === 0) return;

            const results = await Promise.allSettled(
                enabledServers.map(s => fetchServerStatus(s))
            );
            
            const newStatuses: Record<string, Status> = {};
            enabledServers.forEach((server, index) => {
                const result = results[index];
                if (result.status === 'fulfilled') {
                    newStatuses[server.id] = result.value;
                } else {
                    console.error(`Failed to fetch status for server ${server.id}`, result.reason);
                    newStatuses[server.id] = { status: 'offline', resources: { cpu: 0, mem: 0, hdd: 0, gpu: 0 } };
                }
            });
            setStatuses(prev => ({ ...prev, ...newStatuses }));
        };
        
        if (servers.length > 0) {
            fetchAllStatuses();
            const interval = setInterval(fetchAllStatuses, 3000);
            return () => clearInterval(interval);
        }
    }, [servers]);

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
                            <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('server_config_table_status')}</th>
                            <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('server_config_table_name')}</th>
                            <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('server_config_table_url')}</th>
                            <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('server_config_table_resources')}</th>
                            <th className="py-3 px-6 text-right font-semibold text-gray-600 dark:text-gray-300">{t('server_config_table_actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
                        ) : servers.map(server => (
                            <tr key={server.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="py-4 px-6"><ServerStatus status={statuses[server.id] || null} isEnabled={server.enabled} /></td>
                                <td className="py-4 px-6 font-medium">{server.name}</td>
                                <td className="py-4 px-6 text-gray-500 dark:text-gray-400 font-mono">{server.url}</td>
                                <td className="py-4 px-6 text-sm">
                                   <ServerStatus status={statuses[server.id] || null} isEnabled={server.enabled} showResources={true} />
                                </td>
                                <td className="py-4 px-6 text-right space-x-2">
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

export default ServersTab;
