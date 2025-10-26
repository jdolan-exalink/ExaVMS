
import React, { useState, useEffect } from 'react';
import { modules } from '../modules';
import ModuleCard from '../components/ModuleCard';
import { useTranslation } from '../hooks/useTranslation';

const checkBackend = async (url: string): Promise<boolean> => {
  // In a real app, this would be a fetch request.
  // We simulate it with a random success/failure.
  // The ERP module is intentionally made more likely to fail for demonstration.
  const isErp = url.includes('erp');
  const successRate = isErp ? 0.3 : 0.9;
  
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(Math.random() < successRate);
    }, 500 + Math.random() * 1000);
  });
};

const Dashboard = () => {
  const { t } = useTranslation();
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const checkAllBackends = async () => {
      const enabledModules = modules.filter(m => m.enabled);
      const promises = enabledModules.map(async (module) => {
        // FIX: Check if module.api is defined. Assume online if not.
        const isOnline = module.api ? await checkBackend(module.api) : true;
        return { id: module.id, isOnline };
      });
      const results = await Promise.all(promises);
      const newStatus = results.reduce((acc, result) => {
        acc[result.id] = result.isOnline;
        return acc;
      }, {} as Record<string, boolean>);
      setOnlineStatus(newStatus);
    };

    checkAllBackends();
  }, []);

  const enabledModules = modules.filter(m => m.enabled);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{t('dashboard_title')}</h2>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{t('dashboard_subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enabledModules.map(module => (
          <ModuleCard
            key={module.id}
            module={module}
            isOnline={onlineStatus[module.id]}
          />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
