import type { User, UserRole } from '../types';
import type { SavedView } from '../modules/liveview/types';

// This file simulates a user database (like SQLite) using localStorage.

const USERS_KEY = 'users_db';
const VIEWS_KEY = 'live_views'; // Same key used by LiveViewPage

// The initializeUsers function has been moved to api/auth.ts to ensure
// it runs on app startup before any authentication attempt.

export const getUsers = async (): Promise<User[]> => {
    return new Promise((resolve) => {
        const storedUsers = localStorage.getItem(USERS_KEY);
        resolve(storedUsers ? JSON.parse(storedUsers) : []);
    });
};

const getPasswords = async (): Promise<Record<string, string>> => {
     return new Promise((resolve) => {
        const storedPasswords = localStorage.getItem(`${USERS_KEY}_passwords`);
        resolve(storedPasswords ? JSON.parse(storedPasswords) : {});
    });
}

const saveUsers = async (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const savePasswords = async (passwords: Record<string, string>) => {
    localStorage.setItem(`${USERS_KEY}_passwords`, JSON.stringify(passwords));
}

export const addUser = async (userData: Omit<User, 'id'> & { password?: string }): Promise<User> => {
    const users = await getUsers();
    const passwords = await getPasswords();
    
    if (users.some(u => u.username === userData.username)) {
        throw new Error("Username already exists");
    }

    const newUser: User = { ...userData, id: `user_${Date.now()}` };
    
    const updatedUsers = [...users, newUser];
    await saveUsers(updatedUsers);

    if (userData.password) {
        const updatedPasswords = { ...passwords, [newUser.id]: userData.password };
        await savePasswords(updatedPasswords);
    }
    
    return newUser;
};

export const updateUser = async (userId: string, userData: Partial<Omit<User, 'id' | 'username'>> & { password?: string }): Promise<User> => {
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
        throw new Error("User not found");
    }

    const updatedUser = { ...users[userIndex], ...userData };
    users[userIndex] = updatedUser;
    await saveUsers(users);

    if (userData.password) {
        const passwords = await getPasswords();
        const updatedPasswords = { ...passwords, [userId]: userData.password };
        await savePasswords(updatedPasswords);
    }
    
    return updatedUser;
};


export const deleteUser = async (userId: string): Promise<void> => {
    let users = await getUsers();
    let passwords = await getPasswords();

    users = users.filter(u => u.id !== userId);
    delete passwords[userId];

    await saveUsers(users);
    await savePasswords(passwords);
};

// --- View Sharing API ---

export const getViews = async (): Promise<SavedView[]> => {
    return new Promise((resolve) => {
        const storedViews = localStorage.getItem(VIEWS_KEY);
        resolve(storedViews ? JSON.parse(storedViews) : []);
    });
};

export const updateViewSharing = async (viewId: string, sharedWith: UserRole[]): Promise<SavedView> => {
    const views = await getViews();
    const viewIndex = views.findIndex(v => v.id === viewId);
    if (viewIndex === -1) {
        throw new Error("View not found");
    }

    views[viewIndex].sharedWith = sharedWith;
    localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
    return views[viewIndex];
};