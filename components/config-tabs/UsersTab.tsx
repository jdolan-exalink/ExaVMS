import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { getUsers, addUser, updateUser, deleteUser, getViews, updateViewSharing } from '../../api/users';
import type { User, UserRole } from '../../types';
import type { SavedView } from '../../modules/liveview/types';

// --- ICONS ---
const PlusIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>;
const TrashIcon = (props: React.ComponentProps<'svg'>) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>;

const UserModal = ({ user, onClose, onSave }: { user: Partial<User> | null, onClose: () => void, onSave: (data: any) => void }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ username: '', password: '', role: 'viewer', ...user });
    const isEditing = !!formData.id;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md m-4" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold">{isEditing ? t('users_modal_edit_title') : t('users_modal_add_title')}</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('users_modal_username')}</label>
                            <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required disabled={isEditing} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500 disabled:bg-gray-200 dark:disabled:bg-gray-600" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('users_modal_password')}</label>
                            <input type="password" name="password" id="password" value={formData.password} onChange={handleChange} required={!isEditing} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500" />
                            {isEditing && <p className="mt-1 text-xs text-gray-500">{t('users_modal_password_help')}</p>}
                        </div>
                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('users_modal_role')}</label>
                            <select name="role" id="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-gray-50 dark:bg-gray-700 focus:border-primary-500 focus:ring-primary-500">
                                <option value="viewer">{t('user_role_viewer')}</option>
                                <option value="user">{t('user_role_user')}</option>
                                <option value="admin">{t('user_role_admin')}</option>
                            </select>
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

const UsersTab = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [adminViews, setAdminViews] = useState<SavedView[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);

    const loadData = useCallback(async () => {
        const userList = await getUsers();
        setUsers(userList);
        setAllUsers(userList);
        
        const viewList = await getViews();
        const adminIds = userList.filter(u => u.role === 'admin').map(u => u.id);
        setAdminViews(viewList.filter(v => adminIds.includes(v.ownerId)));

    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleOpenModal = (user: Partial<User> | null = null) => {
        setEditingUser(user);
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (data: any) => {
        const { id, password, ...userData } = data;
        const payload = { ...userData };
        if (password) {
            payload.password = password;
        }

        if (id) {
            await updateUser(id, payload);
        } else {
            await addUser(payload);
        }
        await loadData();
        handleCloseModal();
    };

    const handleDeleteUser = async (user: User) => {
        if (window.confirm(t('users_delete_confirm').replace('{username}', user.username))) {
            await deleteUser(user.id);
            await loadData();
        }
    };
    
    const handleShareChange = async (viewId: string, role: UserRole, isChecked: boolean) => {
        const view = adminViews.find(v => v.id === viewId);
        if (!view) return;

        let newSharedWith = [...view.sharedWith];
        if (isChecked) {
            if (!newSharedWith.includes(role)) newSharedWith.push(role);
        } else {
            newSharedWith = newSharedWith.filter(r => r !== role);
        }
        await updateViewSharing(viewId, newSharedWith);
        await loadData(); // Refresh data
    };
    
    const getOwnerName = (ownerId: string) => allUsers.find(u => u.id === ownerId)?.username || 'Unknown';


    return (
        <div className="space-y-8">
            {/* User Management Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold">{t('users_manage_title')}</h3>
                    <button onClick={() => handleOpenModal()} className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold">
                        <PlusIcon className="w-5 h-5" />
                        {t('users_add_user')}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('users_table_username')}</th>
                                <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('users_table_role')}</th>
                                <th className="py-3 px-6 text-right font-semibold text-gray-600 dark:text-gray-300">{t('users_table_actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="py-4 px-6 font-medium">{user.username}</td>
                                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 capitalize">{t(`user_role_${user.role}`)}</td>
                                    <td className="py-4 px-6 text-right space-x-2">
                                        <button onClick={() => handleOpenModal(user)} className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400"><EditIcon className="w-5 h-5"/></button>
                                        <button disabled={user.username === 'admin'} onClick={() => handleDeleteUser(user)} className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/50 text-red-500 disabled:text-gray-400 disabled:cursor-not-allowed dark:disabled:hover:bg-transparent"><TrashIcon className="w-5 h-5"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* View Sharing Section */}
            <div>
                 <h3 className="text-xl font-semibold mb-2">{t('users_views_title')}</h3>
                 <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('users_views_description')}</p>
                 <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
                         <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('users_views_table_view')}</th>
                                <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('users_views_table_owner')}</th>
                                <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('users_views_share_user_group')}</th>
                                <th className="py-3 px-6 text-left font-semibold text-gray-600 dark:text-gray-300">{t('users_views_share_viewer_group')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                           {adminViews.map(view => (
                                <tr key={view.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="py-4 px-6 font-medium">{view.name}</td>
                                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400">{getOwnerName(view.ownerId)}</td>
                                    <td className="py-4 px-6">
                                        <input type="checkbox"
                                          checked={view.sharedWith.includes('user')}
                                          onChange={(e) => handleShareChange(view.id, 'user', e.target.checked)}
                                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                                    </td>
                                    <td className="py-4 px-6">
                                        <input type="checkbox"
                                          checked={view.sharedWith.includes('viewer')}
                                          onChange={(e) => handleShareChange(view.id, 'viewer', e.target.checked)}
                                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500" />
                                    </td>
                                </tr>
                           ))}
                        </tbody>
                    </table>
                 </div>
            </div>

            {modalOpen && <UserModal user={editingUser} onClose={handleCloseModal} onSave={handleSaveUser} />}
        </div>
    );
};

export default UsersTab;