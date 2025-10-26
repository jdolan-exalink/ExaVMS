
import React from 'react';
import { Link } from 'react-router-dom';
import type { ModuleConfig } from '../types';
import { useTranslation } from '../hooks/useTranslation';

interface ModuleCardProps {
  module: ModuleConfig;
  isOnline: boolean;
}

const StatusIndicator: React.FC<{ isOnline: boolean | null }> = ({ isOnline }) => {
  const { t } = useTranslation();

  if (isOnline === null) {
    return (
      <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400">
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 mr-2 animate-pulse"></div>
        {t('status_checking')}
      </div>
    );
  }

  if (isOnline) {
    return (
      <div className="flex items-center text-sm text-green-600 dark:text-green-400">
        <div className="w-2.5 h-2.5 rounded-full bg-green-400 mr-2"></div>
        {t('status_online')}
      </div>
    );
  }

  return (
    <div className="flex items-center text-sm text-red-600 dark:text-red-400">
      <div className="w-2.5 h-2.5 rounded-full bg-red-400 mr-2"></div>
      {t('status_offline')}
    </div>
  );
};

const ModuleCard: React.FC<ModuleCardProps> = ({ module, isOnline }) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-1 transition-all duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
                <div className="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-lg text-primary-600 dark:text-primary-400">
                    <module.icon className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">{t(module.nameKey)}</h3>
                    <StatusIndicator isOnline={isOnline} />
                </div>
            </div>
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm h-10">
          {t(`${module.id}_description`)}
        </p>
        <div className="mt-6">
          <Link
            to={`/module/${module.id}`}
            className={`w-full text-center block px-4 py-2 rounded-md font-semibold transition-colors duration-200 ${
              isOnline
                ? 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:ring-offset-gray-800'
                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            aria-disabled={!isOnline}
            onClick={(e) => !isOnline && e.preventDefault()}
          >
            {t('open_module')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ModuleCard;
