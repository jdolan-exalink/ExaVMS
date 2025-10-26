
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../hooks/useTranslation';

// --- ASSETS ---

const VmsLogo = () => (
    <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
        <defs>
            <radialGradient id="logo-gradient" cx="0.5" cy="0.5" r="0.5" fx="0.75" fy="0.25">
                <stop stopColor="#60A5FA"/>
                <stop offset="1" stopColor="#1E40AF"/>
            </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#logo-gradient)" stroke="#DBEAFE" strokeWidth="2" strokeOpacity="0.5" />
        {/* Abstract representation of a camera shutter/AI eye */}
        <path fillRule="evenodd" clipRule="evenodd" d="M50 30C38.9543 30 30 38.9543 30 50C30 61.0457 38.9543 70 50 70C61.0457 70 70 61.0457 70 50C70 38.9543 61.0457 30 50 30ZM40 50C40 44.4772 44.4772 40 50 40C55.5228 40 60 44.4772 60 50C60 55.5228 55.5228 60 50 60C44.4772 60 40 55.5228 40 50Z" fill="white" fillOpacity="0.1"/>
        <path d="M50 50L65 35M50 50L65 65M50 50L35 65M50 50L35 35" stroke="white" strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round"/>
        <circle cx="50" cy="50" r="12" fill="#93C5FD" fillOpacity="0.5"/>
        <circle cx="50" cy="50" r="6" fill="white"/>
    </svg>
);
const UserIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const LockIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;


const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();

    const from = location.state?.from?.pathname || '/';

    useEffect(() => {
        // Force dark mode for the login page
        document.documentElement.classList.add('dark');
        // On component unmount, remove the class if the stored theme is light
        return () => {
            const storedTheme = localStorage.getItem('theme');
            if (storedTheme === 'light') {
                document.documentElement.classList.remove('dark');
            }
        };
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const success = await login(username, password);
            if (success) {
                navigate(from, { replace: true });
            } else {
                setError(t('login_error'));
            }
        } catch (err) {
            setError(t('login_error'));
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-300 font-sans p-4">
            <div className="w-full max-w-sm space-y-8">
                <div className="text-center space-y-4">
                    <VmsLogo />
                    <h1 className="text-3xl font-bold text-white">{t('app_title')}</h1>
                    <p className="text-gray-400">{t('login_title')}</p>
                </div>
                
                {error && <p className="text-sm text-red-400 text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20">{error}</p>}
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <UserIcon className="text-gray-400" />
                        </div>
                        <input
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="block w-full appearance-none rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-3 pl-12 text-white placeholder-gray-500 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm transition"
                            placeholder={t('login_username')}
                        />
                    </div>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <LockIcon className="text-gray-400" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="block w-full appearance-none rounded-lg border border-gray-700 bg-gray-800/50 px-3 py-3 pl-12 text-white placeholder-gray-500 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 sm:text-sm transition"
                            placeholder={t('login_password')}
                        />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <label htmlFor="remember-me" className="flex items-center space-x-2 cursor-pointer text-gray-400 hover:text-white transition">
                            <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-primary-500 focus:ring-primary-600 focus:ring-offset-gray-900" />
                            <span>{t('login_remember_me')}</span>
                        </label>
                        <a href="#" className="font-medium text-primary-400 hover:text-primary-300 transition">{t('login_forgot_password')}</a>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative flex w-full justify-center rounded-lg border border-transparent bg-primary-600 py-3 px-4 text-sm font-semibold text-white shadow-lg shadow-primary-900/20 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition"
                        >
                            {t('login_button')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
