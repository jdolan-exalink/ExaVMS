import type { User } from '../types';

// This file now uses localStorage as the source of truth for users,
// consistent with the user management module (api/users.ts).

const USERS_KEY = 'users_db';
const PASSWORDS_KEY = `${USERS_KEY}_passwords`;


// This function is now the single source of truth for initializing default users.
// It runs once when the app loads.
const initializeUsers = () => {
    const storedUsers = localStorage.getItem(USERS_KEY);
    if (!storedUsers) {
        const defaultUsers: User[] = [
            { id: 'admin_id_0', username: 'admin', role: 'admin' },
            { id: 'user_id_1', username: 'user', role: 'user' },
            { id: 'viewer_id_2', username: 'viewer', role: 'viewer' },
        ];
        const defaultPasswords = {
            'admin_id_0': 'admin123',
            'user_id_1': 'user123',
            'viewer_id_2': 'viewer123'
        };
        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
        localStorage.setItem(PASSWORDS_KEY, JSON.stringify(defaultPasswords));
    }
};

initializeUsers();

// Mocking a JWT-like token system
const createToken = (user: User) => `mock_token_for_${user.username}`;

const decodeToken = (token: string): User | null => {
    if (token.startsWith('mock_token_for_')) {
        const username = token.replace('mock_token_for_', '');
        const storedUsers = localStorage.getItem(USERS_KEY);
        if (!storedUsers) return null;
        const users: User[] = JSON.parse(storedUsers);
        return users.find(u => u.username === username) || null;
    }
    return null;
}

export const apiLogin = (username: string, password: string): Promise<{ user: User, token: string }> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const storedUsers = localStorage.getItem(USERS_KEY);
            const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
            
            const storedPasswords = localStorage.getItem(PASSWORDS_KEY);
            const passwords: Record<string, string> = storedPasswords ? JSON.parse(storedPasswords) : {};

            const user = users.find(u => u.username === username);

            // Check if user exists and if the password for that user's ID matches.
            if (user && passwords[user.id] === password) {
                const token = createToken(user);
                resolve({ user, token });
            } else {
                reject(new Error("Invalid credentials"));
            }
        }, 500);
    });
};

export const apiValidateToken = (token: string): Promise<User> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const user = decodeToken(token);
            if (user) {
                resolve(user);
            } else {
                reject(new Error("Invalid token"));
            }
        }, 200);
    });
};