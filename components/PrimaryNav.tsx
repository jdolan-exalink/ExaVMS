
import React from 'react';
import { NavLink } from 'react-router-dom';
import { modules } from '../modules';
import { useTranslation } from '../hooks/useTranslation';

const PrimaryNav = () => {
  const { t } = useTranslation();
  const enabledModules = modules.filter(m => m.enabled);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md flex-shrink-0">
      <div className="flex items-center space-x-2 px-4">
        {enabledModules.map(module => (
          <NavLink
            key={module.id}
            to={`/module/${module.id}`}
            className={({ isActive }) =>
              `flex items-center gap-2 px-3 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                isActive
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`
            }
          >
            <module.icon className="w-5 h-5" />
            <span>{t(module.shortNameKey)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default PrimaryNav;
