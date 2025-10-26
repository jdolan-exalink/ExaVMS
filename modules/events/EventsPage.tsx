import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useCameras } from '../../contexts/CameraContext';
import { getServers, Server } from '../../config/serverConfig';
import { fetchEvents } from './api';
import type { Event, EventFilters, ObjectType } from './types';
import type { Camera } from '../liveview/types';

// --- ICONS ---
const SearchIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const DownloadIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const TagIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>;


const OBJECT_TYPES_CONFIG: { id: ObjectType, key: string }[] = [
    { id: 'person', key: 'events_object_person' },
    { id: 'car', key: 'events_object_car' },
    { id: 'motorcycle', key: 'events_object_motorcycle' },
    { id: 'bicycle', key: 'events_object_bicycle' },
    { id: 'bus', key: 'events_object_bus' },
    { id: 'truck', key: 'events_object_truck' },
];

const FilterPanel = ({ servers, cameras, onSearch, isLoading }: { servers: Server[], cameras: Camera[], onSearch: (filters: EventFilters) => void, isLoading: boolean }) => {
    const { t } = useTranslation();
    const today = new Date().toISOString().split('T')[0];
    const [filters, setFilters] = useState<EventFilters>({
        searchType: 'detection',
        serverId: 'all',
        cameraId: 'all',
        date: today,
        startTime: '00:00',
        endTime: '23:59',
        objects: [],
    });
    
    const availableCameras = filters.serverId === 'all' 
        ? [] 
        : cameras.filter(c => c.server.id === filters.serverId);

    const handleFilterChange = (field: keyof EventFilters, value: any) => {
        setFilters(prev => {
            const newState = { ...prev, [field]: value };
            if (field === 'serverId' && value !== prev.serverId) {
                newState.cameraId = 'all';
            }
            return newState;
        });
    };

    const handleObjectToggle = (objectType: ObjectType) => {
        handleFilterChange('objects', filters.objects.includes(objectType)
            ? filters.objects.filter(o => o !== objectType)
            : [...filters.objects, objectType]
        );
    };

    const handleSelectAllObjects = () => {
        handleFilterChange('objects', OBJECT_TYPES_CONFIG.map(o => o.id));
    };

    const handleClearAllObjects = () => {
        handleFilterChange('objects', []);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(filters);
    };

    return (
        <aside className="w-full md:w-80 lg:w-96 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg flex-shrink-0">
            <h2 className="text-xl font-bold mb-4">{t('events_search_filters')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button type="button" onClick={() => handleFilterChange('searchType', 'detection')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${filters.searchType === 'detection' ? 'bg-primary-500 text-white shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('events_search_by_detection')}</button>
                    <button type="button" onClick={() => handleFilterChange('searchType', 'time')} className={`flex-1 p-2 rounded-md text-sm font-semibold transition-colors ${filters.searchType === 'time' ? 'bg-primary-500 text-white shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}>{t('events_search_by_time')}</button>
                </div>

                {filters.searchType === 'detection' && (
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('events_object_types')}</label>
                            <div className="space-x-2">
                                <button type="button" onClick={handleSelectAllObjects} className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline">{t('events_select_all')}</button>
                                <button type="button" onClick={handleClearAllObjects} className="text-xs font-medium text-gray-500 hover:underline">{t('events_clear_all')}</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            {OBJECT_TYPES_CONFIG.map(({ id, key }) => (
                                <label key={id} className="flex items-center space-x-2 cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600/50">
                                    <input type="checkbox" checked={filters.objects.includes(id)} onChange={() => handleObjectToggle(id)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 bg-transparent"/>
                                    <span className="text-sm select-none">{t(key)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <label htmlFor="server" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('events_server')}</label>
                    <select id="server" value={filters.serverId} onChange={e => handleFilterChange('serverId', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500">
                        <option value="all">{t('events_all_servers')}</option>
                        {servers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                
                <div>
                    <label htmlFor="camera" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('events_camera')}</label>
                    <select id="camera" value={filters.cameraId} onChange={e => handleFilterChange('cameraId', e.target.value)} disabled={filters.serverId === 'all'} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-200 dark:disabled:bg-gray-600">
                        <option value="all">{t('events_all_cameras')}</option>
                        {availableCameras.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div>
                     <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('events_date')}</label>
                     <input type="date" id="date" value={filters.date} onChange={e => handleFilterChange('date', e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('events_time_range')}</label>
                    <div className="flex items-center space-x-2 mt-1">
                        <input type="time" value={filters.startTime} onChange={e => handleFilterChange('startTime', e.target.value)} className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                        <span>-</span>
                        <input type="time" value={filters.endTime} onChange={e => handleFilterChange('endTime', e.target.value)} className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                    </div>
                </div>

                <button type="submit" disabled={isLoading} className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold disabled:bg-primary-400">
                    {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div> : <SearchIcon className="w-5 h-5"/>}
                    {isLoading ? t('events_searching') : t('events_search_button')}
                </button>
            </form>
        </aside>
    );
};

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
    const { t } = useTranslation();
    const eventDate = new Date(event.timestamp);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden animate-fade-in">
            <div className="relative">
                <img src={event.thumbnailUrl} alt={`Event at ${event.cameraName}`} className="w-full h-40 object-cover" />
                <div className="absolute top-2 right-2">
                    <button className="p-2 bg-black/50 text-white rounded-full hover:bg-primary-600 transition-colors" title={t('events_download_clip')}>
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="p-4">
                <p className="font-bold text-lg">{event.cameraName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{event.serverName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {eventDate.toLocaleDateString()} &mdash; {eventDate.toLocaleTimeString()}
                </p>
                {event.objects.length > 0 && (
                     <div className="mt-3 flex flex-wrap gap-2 items-center">
                        <TagIcon className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                        {event.objects.map(obj => (
                            <span key={obj} className="px-2 py-0.5 text-xs font-semibold rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-300">
                                {t(`events_object_${obj}`)}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const EventsPage = () => {
    const { t } = useTranslation();
    const { servers: cameraServers, cameras } = useCameras();
    const [servers, setServers] = useState<Server[]>([]);
    const [events, setEvents] = useState<Event[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            // Get all servers for display, even if they have no cameras yet.
            const serverList = await getServers();
            setServers(serverList.filter(s => s.enabled));
        };
        loadInitialData();
    }, []);

    const handleSearch = useCallback(async (filters: EventFilters) => {
        setIsLoading(true);
        setEvents(null);
        const results = await fetchEvents(filters, servers);
        setEvents(results);
        setIsLoading(false);
    }, [servers]);

    return (
        <div className="flex flex-col md:flex-row gap-6 h-full">
            <FilterPanel servers={servers} cameras={cameras} onSearch={handleSearch} isLoading={isLoading} />
            <main className="flex-1 overflow-y-auto">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg h-full">
                    <h2 className="text-xl font-bold mb-4">{t('events_results_title')}</h2>
                    {isLoading && (
                        <div className="flex justify-center items-center h-64">
                            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
                        </div>
                    )}
                    {!isLoading && events && events.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                           {events.map(event => <EventCard key={event.id} event={event} />)}
                        </div>
                    )}
                    {!isLoading && events && events.length === 0 && (
                         <div className="flex justify-center items-center h-64 flex-col text-center">
                            <SearchIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"/>
                            <p className="text-gray-500 dark:text-gray-400">{t('events_no_results')}</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Adjust your filters and try again.</p>
                        </div>
                    )}
                     {!isLoading && !events && (
                         <div className="flex justify-center items-center h-64 flex-col text-center">
                            <SearchIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4"/>
                            <p className="text-gray-500 dark:text-gray-400">Ready to find events.</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Use the filters to start a search.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default EventsPage;