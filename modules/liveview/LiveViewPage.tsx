import React, { useState, useEffect, useCallback, DragEvent, useRef } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuth } from '../../hooks/useAuth';
import { useCameras } from '../../contexts/CameraContext';
import WebRTCPlayer from '../../components/WebRTCPlayer';
import type { Camera, GridCellState, GridLayout, SavedView, UserRole } from './types';
import type { Server } from '../../config/serverConfig';

// --- ICONS ---
const CameraIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>;
const ServerIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2"ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>;
const ChevronDownIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m6 9 6 6 6-6"/></svg>;
const CloseIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
const PanelLeftClose = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>;
const PanelLeftOpen = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m14 9-3 3 3 3"/></svg>;
const FullscreenIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>;
const EditIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
const TrashIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;
const SaveIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>;

// --- LAYOUT ICONS ---
const LayoutIcon1x1 = (props: React.ComponentProps<'svg'>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="3" y="3" width="18" height="18" rx="1"/></svg>;
const LayoutIcon2x2 = (props: React.ComponentProps<'svg'>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>;
const LayoutIcon3x3 = (props: React.ComponentProps<'svg'>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}><rect x="3" y="3" width="5.3" height="5.3" rx="1"/><rect x="9.3" y="3" width="5.3" height="5.3" rx="1"/><rect x="15.6" y="3" width="5.3" height="5.3" rx="1"/><rect x="3" y="9.3" width="5.3" height="5.3" rx="1"/><rect x="9.3" y="9.3" width="5.3" height="5.3" rx="1"/><rect x="15.6" y="9.3" width="5.3" height="5.3" rx="1"/><rect x="3" y="15.6" width="5.3" height="5.3" rx="1"/><rect x="9.3" y="15.6" width="5.3" height="5.3" rx="1"/><rect x="15.6" y="15.6" width="5.3" height="5.3" rx="1"/></svg>;
const LayoutIcon1p5 = (props: React.ComponentProps<'svg'>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}><rect x="3" y="3" width="12" height="12" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="16" y="9" width="5" height="5" rx="1"/><rect x="16" y="15" width="5" height="5" rx="1"/><rect x="3" y="16" width="5.5" height="5" rx="1"/><rect x="9.5" y="16" width="5.5" height="5" rx="1"/></svg>;
const LayoutIcon1p11 = (props: React.ComponentProps<'svg'>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}><rect x="3" y="3" width="14" height="14" rx="1"/><rect x="18" y="3" width="3" height="3" rx="0.5"/><rect x="18" y="7" width="3" height="3" rx="0.5"/><rect x="18" y="11" width="3" height="3" rx="0.5"/><rect x="18" y="15" width="3" height="3" rx="0.5"/><rect x="3" y="18" width="3" height="3" rx="0.5"/><rect x="7" y="18" width="3" height="3" rx="0.5"/><rect x="11" y="18" width="3" height="3" rx="0.5"/><rect x="15" y="18" width="3" height="3" rx="0.5"/></svg>;

// --- HELPER FUNCTIONS ---
const getGridTemplate = (layout: GridLayout) => {
    switch (layout) {
        case '1x1': return 'grid-cols-1 grid-rows-1';
        case '2x2': return 'grid-cols-2 grid-rows-2';
        case '3x3': return 'grid-cols-3 grid-rows-3';
        case '1+5': return 'grid-cols-3 grid-rows-3';
        case '1+11': return 'grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr);';
        default: return 'grid-cols-2 grid-rows-2';
    }
};

const getGridCellsCount = (layout: GridLayout): number => {
    const counts = { '1x1': 1, '2x2': 4, '3x3': 9, '1+5': 6, '1+11': 13 };
    return counts[layout];
};

const createInitialGridState = (layout: GridLayout): GridCellState[] => {
    return Array.from({ length: getGridCellsCount(layout) }, (_, i) => ({
        id: i,
        camera: null,
        quality: 'sub',
    }));
};

interface SavedViewItemProps {
  view: SavedView;
  isShared: boolean;
  onLoadView: (id: string) => void;
  onRenameView: (id: string, newName: string) => void;
  onDeleteView: (id: string) => void;
}

const SavedViewItem: React.FC<SavedViewItemProps> = ({ view, isShared, onLoadView, onRenameView, onDeleteView }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [renamingViewId, setRenamingViewId] = useState<string | null>(null);

    const handleRename = (id: string, newName: string) => {
        if (newName.trim()) {
            onRenameView(id, newName.trim());
        }
        setRenamingViewId(null);
    };

    const handleViewDragStart = (e: DragEvent<HTMLDivElement>, view: SavedView) => {
        e.dataTransfer.setData('application/view+json', JSON.stringify(view));
    };

    const canEdit = user?.id === view.ownerId || user?.role === 'admin';
    const itemClasses = `group flex items-center justify-between p-2 rounded-md cursor-pointer ${isShared ? 'bg-cyan-100 dark:bg-cyan-900/50 hover:bg-cyan-200 dark:hover:bg-cyan-900' : 'hover:bg-primary-100 dark:hover:bg-primary-900/50'}`;

    return (
        <div draggable onDragStart={(e) => handleViewDragStart(e, view)} onDoubleClick={() => onLoadView(view.id)} className={itemClasses}>
            {renamingViewId === view.id && canEdit ? (
                <input type="text" defaultValue={view.name} onBlur={(e) => handleRename(view.id, e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }} autoFocus className="bg-transparent w-full focus:outline-none focus:ring-1 ring-primary-500 rounded px-1 -ml-1" />
            ) : (
                <span className="truncate">{view.name}</span>
            )}
            {renamingViewId !== view.id && canEdit && (
                <div className="items-center space-x-1 hidden group-hover:flex">
                    <button onClick={() => setRenamingViewId(view.id)} className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600" title={t('liveview_rename_view')}><EditIcon className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onDeleteView(view.id)} className="p-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600" title={t('liveview_delete_view')}><TrashIcon className="w-3.5 h-3.5" /></button>
                </div>
            )}
        </div>
    );
};


// --- SIDEBAR ---
const Sidebar = React.memo(({ servers, cameras, personalViews, sharedViews, isCollapsed, onToggle, onLoadView, onRenameView, onDeleteView }: { servers: Server[], cameras: Camera[], personalViews: SavedView[], sharedViews: SavedView[], isCollapsed: boolean, onToggle: () => void, onLoadView: (id: string) => void, onRenameView: (id: string, newName: string) => void, onDeleteView: (id: string) => void }) => {
    const { t } = useTranslation();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const initialExpandedState = servers.reduce((acc, server) => {
            acc[server.id] = true;
            return acc;
        }, { 'personal-views': true, 'shared-views': true } as Record<string, boolean>);
        setExpanded(initialExpandedState);
    }, [servers]);

    const handleCameraDragStart = (e: DragEvent<HTMLDivElement>, camera: Camera) => {
        if (!camera.isOnline) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('application/json', JSON.stringify(camera));
    };

    if (isCollapsed) {
        return (
             <div className="bg-white dark:bg-gray-800 p-2 border-r border-gray-200 dark:border-gray-700">
                <button onClick={onToggle} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 w-full">
                    <PanelLeftOpen className="w-6 h-6 mx-auto" />
                </button>
            </div>
        );
    }

    const camerasByServer = cameras.reduce((acc, cam) => {
        (acc[cam.server.id] = acc[cam.server.id] || []).push(cam);
        return acc;
    }, {} as Record<string, Camera[]>);

    return (
        <aside className="bg-white dark:bg-gray-800 w-64 p-4 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-lg font-semibold">{t('liveview_sidebar_title')}</h2>
                 <button onClick={onToggle} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600">
                    <PanelLeftClose className="w-6 h-6" />
                </button>
            </div>
            <div className="overflow-y-auto flex-grow">
                {servers.map(server => {
                    const serverCameras = camerasByServer[server.id] || [];
                    const isServerOnline = serverCameras.length > 0;
                    return (
                        <div key={server.id} className="mb-2">
                            <button className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setExpanded(prev => ({ ...prev, [server.id]: !prev[server.id] }))}>
                                <div className="flex items-center space-x-2">
                                    <ServerIcon className={`w-5 h-5 ${isServerOnline ? 'text-primary-500' : 'text-gray-400'}`} />
                                    <span className={`font-medium ${!isServerOnline ? 'text-gray-500' : ''}`}>{server.name}</span>
                                    {!isServerOnline && <div className="w-2 h-2 rounded-full bg-red-500" title="Offline"></div>}
                                </div>
                                <ChevronDownIcon className={`w-5 h-5 transition-transform ${expanded[server.id] ? 'rotate-180' : ''}`} />
                            </button>
                            {expanded[server.id] && (
                                <div className="pl-4 pt-2">
                                    {isServerOnline ? (
                                        serverCameras.map(camera => (
                                            <div key={camera.id} draggable={camera.isOnline} onDragStart={(e) => handleCameraDragStart(e, camera)} 
                                                 className={`flex items-center space-x-2 p-2 rounded-md ${camera.isOnline ? 'hover:bg-primary-100 dark:hover:bg-primary-900/50 cursor-grab' : 'opacity-50 cursor-not-allowed'}`}>
                                                <CameraIcon className="w-4 h-4 text-gray-500" />
                                                <span>{camera.name}</span>
                                                {!camera.isOnline && <div className="w-1.5 h-1.5 rounded-full bg-red-500" title="Offline"></div>}
                                            </div>
                                        ))
                                    ) : (
                                        <p className="px-2 py-1 text-sm text-gray-500 italic">{t('server_config_status_offline')}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
                
                <div className="mb-2">
                    <button className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setExpanded(prev => ({ ...prev, 'personal-views': !prev['personal-views'] }))}>
                        <div className="flex items-center space-x-2"><SaveIcon className="w-5 h-5 text-green-500" /><span className="font-medium">{t('liveview_personal_views')}</span></div>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${expanded['personal-views'] ? 'rotate-180' : ''}`} />
                    </button>
                    {expanded['personal-views'] && (
                        <div className="pl-4 pt-2 space-y-1">
                            {personalViews.length > 0 ? personalViews.map(view => (
                                <SavedViewItem key={view.id} view={view} isShared={false} onLoadView={onLoadView} onRenameView={onRenameView} onDeleteView={onDeleteView} />
                            )) : <p className="px-2 py-1 text-sm text-gray-500">{t('liveview_no_views')}</p>}
                        </div>
                    )}
                </div>
                 <div className="mb-2">
                    <button className="w-full flex items-center justify-between p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setExpanded(prev => ({ ...prev, 'shared-views': !prev['shared-views'] }))}>
                        <div className="flex items-center space-x-2"><SaveIcon className="w-5 h-5 text-cyan-500" /><span className="font-medium">{t('liveview_shared_views')}</span></div>
                        <ChevronDownIcon className={`w-5 h-5 transition-transform ${expanded['shared-views'] ? 'rotate-180' : ''}`} />
                    </button>
                    {expanded['shared-views'] && (
                        <div className="pl-4 pt-2 space-y-1">
                            {sharedViews.length > 0 ? sharedViews.map(view => (
                                <SavedViewItem key={view.id} view={view} isShared={true} onLoadView={onLoadView} onRenameView={onRenameView} onDeleteView={onDeleteView} />
                            )) : <p className="px-2 py-1 text-sm text-gray-500">{t('liveview_no_views')}</p>}
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
});


// --- VIDEO PLAYER WRAPPER ---
const VideoCell = React.memo(({ cell, onQualityChange, onClearCell }: { cell: GridCellState, onQualityChange: (id: number, quality: 'main' | 'sub') => void, onClearCell: (id: number) => void }) => {
    const { t } = useTranslation();

    if (!cell.camera) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md">
                <p className="text-gray-400 dark:text-gray-500">{t('liveview_no_camera')}</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-black rounded-md flex flex-col relative group overflow-hidden">
            <div className="absolute top-0 left-0 right-0 p-2 bg-gradient-to-b from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex justify-between items-center">
                <p className="text-white text-sm font-semibold truncate">{cell.camera.server.name} / {cell.camera.name}</p>
                <button onClick={() => onClearCell(cell.id)} className="p-1 rounded-full text-white hover:bg-white/20">
                    <CloseIcon className="w-4 h-4" />
                </button>
            </div>

            {(cell.camera.streams.main || cell.camera.streams.sub) ? (
                <WebRTCPlayer 
                    streams={cell.camera.streams} 
                    quality={cell.quality} 
                    onQualityChange={(newQuality) => onQualityChange(cell.id, newQuality)}
                />
            ) : (
                <div className="flex-grow flex items-center justify-center text-white/50">
                    <span>No stream URL</span>
                </div>
            )}
        </div>
    );
});

// --- CAMERA GRID ---
const CameraGrid = React.memo(({ gridState, layout, maximizedCellId, onDrop, onQualityChange, onClearCell, onMaximizeToggle }: { gridState: GridCellState[], layout: GridLayout, maximizedCellId: number | null, onDrop: (cellId: number, camera: Camera) => void, onQualityChange: (id: number, quality: 'main' | 'sub') => void, onClearCell: (id: number) => void, onMaximizeToggle: (cellId: number) => void }) => {
    
    const handleDragOver = (e: DragEvent<HTMLDivElement>) => e.preventDefault();
    const handleDrop = (e: DragEvent<HTMLDivElement>, cellId: number) => {
        e.preventDefault();
        e.stopPropagation();
        const cameraData = e.dataTransfer.getData('application/json');
        if (cameraData) {
            onDrop(cellId, JSON.parse(cameraData));
        }
    };
    
    if (maximizedCellId !== null) {
        const maximizedCell = gridState.find(c => c.id === maximizedCellId);
        if (maximizedCell) {
            return (
                <div className="w-full h-full" onDoubleClick={() => onMaximizeToggle(maximizedCellId)}>
                    <VideoCell cell={maximizedCell} onQualityChange={onQualityChange} onClearCell={onClearCell}/>
                </div>
            );
        }
    }

    const gridClasses = getGridTemplate(layout);
    
    return (
        <div className={`w-full h-full grid gap-2 ${layout !== '1+11' ? gridClasses : ''}`} style={layout === '1+11' ? {display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(4, 1fr)'} : {}}>
            {gridState.map(cell => (
                <div key={cell.id} 
                     onDragOver={handleDragOver} 
                     onDrop={(e) => handleDrop(e, cell.id)}
                     onDoubleClick={() => cell.camera && onMaximizeToggle(cell.id)}
                     className={`${(layout === '1+5' && cell.id === 0) ? 'col-span-2 row-span-2' : ''} ${(layout === '1+11' && cell.id === 0) ? 'col-start-1 col-end-3 row-start-1 row-end-3' : ''}`}
                >
                    <VideoCell cell={cell} onQualityChange={onQualityChange} onClearCell={onClearCell}/>
                </div>
            ))}
        </div>
    );
});


// --- TOOLBAR ---
const Toolbar = React.memo(({ layout, onLayoutChange, onOpenSaveModal, onFullscreen }: { layout: GridLayout, onLayoutChange: (layout: GridLayout) => void, onOpenSaveModal: () => void, onFullscreen: () => void }) => {
    const { t } = useTranslation();
    
    const layouts: {id: GridLayout, icon: React.FC<any>}[] = [
        {id: '1x1', icon: LayoutIcon1x1}, 
        {id: '2x2', icon: LayoutIcon2x2}, 
        {id: '3x3', icon: LayoutIcon3x3}, 
        {id: '1+5', icon: LayoutIcon1p5},
        {id: '1+11', icon: LayoutIcon1p11},
    ];

    return (
        <div className="bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between space-x-4 flex-shrink-0">
            <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm">{t('liveview_grid_layout')}:</span>
                    <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md p-1">
                        {layouts.map(l => (
                            <button key={l.id} onClick={() => onLayoutChange(l.id)} className={`p-1.5 rounded-md ${layout === l.id ? 'bg-primary-500 text-white shadow' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`} title={t(`liveview_layout_tooltip_${l.id}`)}>
                               <l.icon className="w-5 h-5" />
                               <span className="sr-only">{l.id}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={onOpenSaveModal} className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-semibold flex items-center gap-2">
                    <SaveIcon className="w-4 h-4" />
                    {t('liveview_save_view')}
                </button>
            </div>
            <button onClick={onFullscreen} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600" title={t('liveview_fullscreen')}>
                <FullscreenIcon className="w-5 h-5" />
            </button>
        </div>
    );
});

// --- SAVE VIEW MODAL ---
const SaveViewModal = ({ isOpen, onClose, onSave, personalViews }: { isOpen: boolean, onClose: () => void, onSave: (data: { mode: 'new', name: string } | { mode: 'overwrite', id: string }) => void, personalViews: SavedView[] }) => {
    const { t } = useTranslation();
    const [mode, setMode] = useState<'new' | 'overwrite'>('new');
    const [newViewName, setNewViewName] = useState('');
    const [selectedViewId, setSelectedViewId] = useState<string>(personalViews[0]?.id || '');

    useEffect(() => {
      if (personalViews.length === 0) {
        setMode('new');
      } else if (!selectedViewId) {
        setSelectedViewId(personalViews[0].id);
      }
    }, [personalViews, selectedViewId]);

    if (!isOpen) return null;

    const handleSave = () => {
        if (mode === 'new') {
            if (newViewName.trim()) {
                onSave({ mode: 'new', name: newViewName.trim() });
            }
        } else {
            if (selectedViewId) {
                onSave({ mode: 'overwrite', id: selectedViewId });
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-semibold">{t('liveview_save_view_modal_title')}</h3>
                </div>
                <div className="p-6 space-y-4">
                    <fieldset className="space-y-2">
                        <div>
                            <label className="flex items-center space-x-2 cursor-pointer">
                                <input type="radio" name="save-mode" value="new" checked={mode === 'new'} onChange={() => setMode('new')} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600" />
                                <span>{t('liveview_save_as_new')}</span>
                            </label>
                            {mode === 'new' && (
                                <div className="pl-6 mt-2">
                                    <label htmlFor="newViewName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sr-only">{t('liveview_enter_new_name')}</label>
                                    <input type="text" id="newViewName" value={newViewName} onChange={(e) => setNewViewName(e.target.value)} placeholder={t('liveview_view_name_placeholder')} className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" autoFocus />
                                </div>
                            )}
                        </div>
                        <div>
                            <label className={`flex items-center space-x-2 ${personalViews.length === 0 ? 'cursor-not-allowed text-gray-400' : 'cursor-pointer'}`}>
                                <input type="radio" name="save-mode" value="overwrite" checked={mode === 'overwrite'} onChange={() => setMode('overwrite')} disabled={personalViews.length === 0} className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600" />
                                <span>{t('liveview_overwrite_existing')}</span>
                            </label>
                            {mode === 'overwrite' && personalViews.length > 0 && (
                                <div className="pl-6 mt-2">
                                    <label htmlFor="viewToOverwrite" className="block text-sm font-medium text-gray-700 dark:text-gray-300 sr-only">{t('liveview_select_view_to_overwrite')}</label>
                                    <select id="viewToOverwrite" value={selectedViewId} onChange={(e) => setSelectedViewId(e.target.value)} className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500">
                                        {personalViews.map(view => <option key={view.id} value={view.id}>{view.name}</option>)}
                                    </select>
                                </div>
                            )}
                             {mode === 'overwrite' && personalViews.length === 0 && (
                                 <p className="pl-6 mt-1 text-sm text-gray-500">{t('liveview_no_personal_views')}</p>
                             )}
                        </div>
                    </fieldset>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500">{t('liveview_cancel_button')}</button>
                    <button type="button" onClick={handleSave} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 disabled:bg-primary-400 dark:disabled:bg-primary-800" disabled={(mode === 'new' && !newViewName.trim()) || (mode === 'overwrite' && !selectedViewId)}>{t('liveview_save_button')}</button>
                </div>
            </div>
        </div>
    );
};


// --- MAIN PAGE ---
const LiveViewPage = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { servers, cameras, isLoading } = useCameras();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [layout, setLayout] = useState<GridLayout>('2x2');
    const [gridState, setGridState] = useState<GridCellState[]>(createInitialGridState('2x2'));
    const [allViews, setAllViews] = useState<SavedView[]>([]);
    const [maximizedCellId, setMaximizedCellId] = useState<number | null>(null);
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const gridContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const storedViews = localStorage.getItem('live_views');
        if(storedViews) {
            setAllViews(JSON.parse(storedViews));
        } else {
            const demoSharedView: SavedView = {
                id: 'shared_demo_1', name: "Admin's Shared View", layout: '2x2',
                gridState: createInitialGridState('2x2'), ownerId: 'admin_id_0', sharedWith: ['user', 'viewer']
            };
            setAllViews([demoSharedView]);
            localStorage.setItem('live_views', JSON.stringify([demoSharedView]));
        }
    }, []);
    
    useEffect(() => {
        setMaximizedCellId(null);
        setGridState(createInitialGridState(layout));
    }, [layout]);

    const handleLayoutChange = useCallback((newLayout: GridLayout) => setLayout(newLayout), []);
    
    const handleDrop = useCallback((cellId: number, camera: Camera) => setGridState(prev => prev.map(cell => cell.id === cellId ? { ...cell, camera } : cell)), []);
    const handleQualityChange = useCallback((cellId: number, quality: 'main' | 'sub') => setGridState(prev => prev.map(cell => cell.id === cellId ? { ...cell, quality } : cell)), []);
    const handleClearCell = useCallback((cellId: number) => setGridState(prev => prev.map(cell => cell.id === cellId ? { ...cell, camera: null } : cell)), []);
    const handleMaximizeToggle = useCallback((cellId: number) => setMaximizedCellId(prev => prev === cellId ? null : cellId), []);
    
    const handleConfirmSaveView = useCallback((saveData: { mode: 'new', name: string } | { mode: 'overwrite', id: string }) => {
        if (!user) return;

        if (saveData.mode === 'new') {
            const newView: SavedView = { 
                id: Date.now().toString(), name: saveData.name, layout, 
                gridState, ownerId: user.id, sharedWith: [] 
            };
            const updatedViews = [...allViews, newView];
            setAllViews(updatedViews);
            localStorage.setItem('live_views', JSON.stringify(updatedViews));
        } else if (saveData.mode === 'overwrite') {
            const updatedViews = allViews.map(view => {
                if (view.id === saveData.id) {
                    return { ...view, layout, gridState };
                }
                return view;
            });
            setAllViews(updatedViews);
            localStorage.setItem('live_views', JSON.stringify(updatedViews));
        }
        setIsSaveModalOpen(false);
    }, [gridState, layout, allViews, user]);

    const handleLoadView = useCallback((id: string) => {
        const viewToLoad = allViews.find(v => v.id === id);
        if(viewToLoad) {
            setLayout(viewToLoad.layout);
            setGridState(viewToLoad.gridState);
        }
    }, [allViews]);
    
    const handleRenameView = useCallback((id: string, newName: string) => {
        const updatedViews = allViews.map(v => v.id === id ? { ...v, name: newName } : v);
        setAllViews(updatedViews);
        localStorage.setItem('live_views', JSON.stringify(updatedViews));
    }, [allViews]);

    const handleDeleteView = useCallback((id: string) => {
        const viewToDelete = allViews.find(v => v.id === id);
        if (viewToDelete && window.confirm(t('liveview_delete_confirm_text').replace('{viewName}', viewToDelete.name))) {
            const updatedViews = allViews.filter(v => v.id !== id);
            setAllViews(updatedViews);
            localStorage.setItem('live_views', JSON.stringify(updatedViews));
        }
    }, [allViews, t]);

    const handleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            gridContainerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }, []);

    const handleViewDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const viewData = e.dataTransfer.getData('application/view+json');
        if (viewData) {
            const view = JSON.parse(viewData);
            handleLoadView(view.id);
        }
    }
    
    const personalViews = user ? allViews.filter(v => v.ownerId === user.id) : [];
    const sharedViews = user ? allViews.filter(v => v.ownerId !== user.id && v.sharedWith.includes(user.role)) : [];

    return (
        <div className="h-full">
            <div className="flex h-full bg-gray-100 dark:bg-gray-900">
                <Sidebar 
                    servers={servers}
                    cameras={cameras}
                    personalViews={personalViews}
                    sharedViews={sharedViews}
                    isCollapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(prev => !prev)}
                    onLoadView={handleLoadView}
                    onRenameView={handleRenameView}
                    onDeleteView={handleDeleteView}
                />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <Toolbar 
                        layout={layout} 
                        onLayoutChange={handleLayoutChange}
                        onOpenSaveModal={() => setIsSaveModalOpen(true)}
                        onFullscreen={handleFullscreen}
                    />
                    <main ref={gridContainerRef} className="flex-1 p-2 overflow-auto bg-gray-200 dark:bg-gray-900" onDragOver={(e) => e.preventDefault()} onDrop={handleViewDrop}>
                        {isLoading && cameras.length === 0 ? (
                             <div className="flex justify-center items-center h-full">
                                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-500"></div>
                            </div>
                        ) : (
                            <CameraGrid 
                                gridState={gridState} 
                                layout={layout} 
                                maximizedCellId={maximizedCellId}
                                onDrop={handleDrop} 
                                onQualityChange={handleQualityChange}
                                onClearCell={handleClearCell}
                                onMaximizeToggle={handleMaximizeToggle}
                            />
                        )}
                    </main>
                </div>
            </div>
            <SaveViewModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onSave={handleConfirmSaveView}
                personalViews={personalViews}
            />
        </div>
    );
};

export default LiveViewPage;