
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from '../hooks/useTranslation';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { modules } from '../modules';
import UserMenu from './UserMenu';

const Logo = ({ size = 40 }: { size?: number }) => {
  const { theme } = useTheme();

  const colors = theme === 'dark'
    ? { // Colors for dark theme (vibrant)
        gradientStart: '#60A5FA',
        gradientEnd: '#1E40AF',
        stroke: '#DBEAFE',
        centerFill: '#93C5FD',
        centerDot: '#FFFFFF'
      }
    : { // Colors for light theme (professional blue)
        gradientStart: '#3B82F6',
        gradientEnd: '#1D4ED8',
        stroke: '#93C5FD',
        centerFill: '#60A5FA',
        centerDot: '#FFFFFF'
      };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="logo-gradient-header" cx="0.5" cy="0.5" r="0.5" fx="0.75" fy="0.25">
                <stop stopColor={colors.gradientStart}/>
                <stop offset="1" stopColor={colors.gradientEnd}/>
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#logo-gradient-header)" stroke={colors.stroke} strokeWidth="2" strokeOpacity="0.5" />
        <circle cx="50" cy="50" r="12" fill={colors.centerFill} fillOpacity="0.7" />
        <circle cx="50" cy="50" r="6" fill={colors.centerDot}/>
    </svg>
  );
};


const Header = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const accessibleModules = modules.filter(m => {
    if (!m.enabled) return false;
    if (!m.permissions?.view || m.permissions.view.length === 0) return true; // Public module
    if (!user) return false;
    return m.permissions.view.includes(user.role);
  });

  return (
    <header className="bg-white/80 dark:bg-[#0b1120]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center transition-colors duration-300 flex-shrink-0 z-10">
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 flex-shrink-0">
          <Logo />
          <span className="text-xl font-bold text-gray-800 dark:text-gray-200 hidden sm:inline">{t('app_title')}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-2">
           <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
          {accessibleModules.map(module => (
            <NavLink
              key={module.id}
              to={`/module/${module.id}`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <module.icon className="w-5 h-5" />
              <span>{t(module.shortNameKey)}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <UserMenu />
    </header>
  );
};

export default Header;