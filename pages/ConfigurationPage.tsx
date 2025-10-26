import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import ServersTab from '../components/config-tabs/ServersTab';
import UsersTab from '../components/config-tabs/UsersTab';

const PlaceholderTab = ({ title }: { title: string }) => (
    <div className="p-8 text-center text-gray-500">
        <h2 className="text-2xl font-bold">Coming Soon</h2>
        <p>{title} configuration will be available here.</p>
    </div>
);

const ConfigurationPage = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('servers');

    const tabs = [
        { id: 'servers', labelKey: 'config_tab_servers', component: <ServersTab /> },
        { id: 'lpr', labelKey: 'config_tab_lpr', component: <PlaceholderTab title={t('config_tab_lpr')} /> },
        { id: 'traffic', labelKey: 'config_tab_traffic', component: <PlaceholderTab title={t('config_tab_traffic')} /> },
        { id: 'users', labelKey: 'config_tab_users', component: <UsersTab /> },
        { id: 'services', labelKey: 'config_tab_services', component: <PlaceholderTab title={t('config_tab_services')} /> },
    ];

    const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || null;

    return (
        <div className="flex flex-col h-full p-4 sm:p-6 lg:p-8">
            <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === tab.id
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-600'
                                }
                            `}
                        >
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="flex-grow overflow-y-auto mt-4">
                {ActiveComponent}
            </div>
        </div>
    );
};

export default ConfigurationPage;