import React from 'react';
import { ServerStatus as Status } from '../../api/serverStatus';
import { useTranslation } from '../../hooks/useTranslation';

const ProgressBar = ({ value, colorClass }: { value: number, colorClass: string }) => (
    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
        <div className={`${colorClass} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
);

const ServerStatus = ({ status, isEnabled, showResources = false }: { status: Status | null, isEnabled: boolean, showResources?: boolean }) => {
    const { t } = useTranslation();

    if (!isEnabled) {
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Disabled</span>;
    }

    if (!status) {
        return <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400 mr-2 animate-pulse"></div>...</div>;
    }

    if (showResources) {
        if(status.status === 'offline') return <span className="text-gray-400">-</span>;
        
        return (
            <div className="space-y-1.5 min-w-[120px]">
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs w-8">CPU</span>
                    <ProgressBar value={status.resources.cpu} colorClass="bg-blue-500" />
                    <span className="font-mono text-xs w-10 text-right">{status.resources.cpu}%</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="font-mono text-xs w-8">GPU</span>
                    <ProgressBar value={status.resources.gpu} colorClass="bg-purple-500" />
                    <span className="font-mono text-xs w-10 text-right">{status.resources.gpu}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs w-8">MEM</span>
                    <ProgressBar value={status.resources.mem} colorClass="bg-green-500" />
                    <span className="font-mono text-xs w-10 text-right">{status.resources.mem}%</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-mono text-xs w-8">HDD</span>
                    <ProgressBar value={status.resources.hdd} colorClass="bg-red-500" />
                    <span className="font-mono text-xs w-10 text-right">{status.resources.hdd}%</span>
                </div>
            </div>
        );
    }
    
    return (
        <div className={`flex items-center text-sm ${status.status === 'online' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            <div className={`w-2.5 h-2.5 rounded-full ${status.status === 'online' ? 'bg-green-400' : 'bg-red-400'} mr-2`}></div>
            {t(status.status === 'online' ? 'server_config_status_online' : 'server_config_status_offline')}
        </div>
    );
};

export default ServerStatus;
