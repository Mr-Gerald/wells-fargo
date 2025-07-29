

import React, { createContext, useState, useContext, useCallback } from 'react';
import { User, Admin } from '../types';

type SignupData = {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone: string;
    ssn: string;
    dob?: string;
}

type UpdateUserData = {
    username?: string;
    fullName?: string;
    password?: string;
    email?: string;
    phone?: string;
    dob?: string;
}

interface AuthContextType {
    currentUser: User | Admin | null;
    loadingAuth: boolean;
    login: (username: string, password:string) => Promise<User | Admin | null>;
    logout: () => void;
    signup: (data: SignupData) => Promise<User | null>;
    updateUser: (userId: string, data: UpdateUserData) => Promise<User | null>;
    addNotification: (userId: string, message: string) => Promise<void>;
    checkAuthStatus: () => Promise<void>;
    readNotification: (notificationId: string) => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
    updateAlexLocally: (updater: (prev: User | null) => User | null) => void;
    createInstantAccount: (data: SignupData) => Promise<User | null>;
    resetUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | Admin | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

    const updateCurrentUserState = (user: User | Admin) => {
        if ('accounts' in user && user.id === 'user-1') {
            localStorage.setItem('localUser-user-1', JSON.stringify(user));
        }
        setCurrentUser(user);
    }

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        // For the demo user 'user-1', we persist their state by not removing their data from localStorage on logout.
        // This ensures changes are remembered within the same browser session.
        // localStorage.removeItem('localUser-user-1');
        setCurrentUser(null);
    }, []);

    const checkAuthStatus = useCallback(async () => {
        setLoadingAuth(true);
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const user = await response.json();
                    if (user.id === 'user-1') {
                        const localUserStr = localStorage.getItem('localUser-user-1');
                        if (localUserStr) {
                            setCurrentUser(JSON.parse(localUserStr));
                        } else {
                            updateCurrentUserState(user);
                        }
                    } else {
                        setCurrentUser(user);
                    }
                } else {
                    logout();
                }
            } catch (error) {
                console.error('Auth check failed', error);
                logout();
            }
        } else {
            setCurrentUser(null);
        }
        setLoadingAuth(false);
    }, [logout]);

    const login = async (username: string, password: string): Promise<User | Admin | null> => {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Login failed');
        }

        const { token, user } = await response.json();
        localStorage.setItem('token', token);
        
        if (user.id === 'user-1') {
            const localUserStr = localStorage.getItem('localUser-user-1');
            if (localUserStr) {
                 setCurrentUser(JSON.parse(localUserStr));
            } else {
                 updateCurrentUserState(user);
            }
        } else {
            setCurrentUser(user);
        }
        return user;
    };


    const signup = async (data: SignupData): Promise<User | null> => {
       const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Signup failed');
        }

        const { user } = await response.json();
        return user;
    };
    
    const updateUser = async (userId: string, data: UpdateUserData): Promise<User | null> => {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Update failed');
        }
        
        const updatedUser = await response.json();
        updateCurrentUserState(updatedUser);
        return updatedUser;
    };

    const addNotification = async (userId: string, message: string) => {
        if(userId === 'user-1'){
            updateAlexLocally(prev => {
                if(!prev) return null;
                const newNotif = { id: `n-local-${Date.now()}`, message, date: new Date().toISOString(), isRead: false };
                const updatedAlex = {...prev, notifications: [newNotif, ...prev.notifications]};
                return updatedAlex;
            });
            return;
        }

        const token = localStorage.getItem('token');
        await fetch(`/api/users/${userId}/notifications`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ message })
        });
    };
    
    const readNotification = async (notificationId: string) => {
        if (!currentUser) return;
        if (currentUser.id === 'user-1' && 'accounts' in currentUser) {
            updateAlexLocally(prev => {
                if(!prev) return null;
                const newNotifications = prev.notifications.map(n => n.id === notificationId ? { ...n, isRead: true } : n);
                return {...prev, notifications: newNotifications};
            });
            return;
        }

        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const updatedUser = await response.json();
                updateCurrentUserState(updatedUser);
            }
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        if (!currentUser) return;
        if (currentUser.id === 'user-1' && 'accounts' in currentUser) {
            updateAlexLocally(prev => {
                if(!prev) return null;
                const newNotifications = prev.notifications.filter(n => n.id !== notificationId);
                return {...prev, notifications: newNotifications};
            });
            return;
        }
        
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const updatedUser = await response.json();
                updateCurrentUserState(updatedUser);
            }
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    const deleteAccount = async () => {
        const token = localStorage.getItem('token');
        if (!currentUser || !('accounts' in currentUser)) return;

        try {
            const response = await fetch(`/api/users/${currentUser.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to delete account");
            }
            logout();
        } catch (error) {
            console.error("Delete account error:", error);
            throw error;
        }
    };

    const updateAlexLocally = (updater: (prev: User | null) => User | null) => {
        setCurrentUser(prev => {
            if (prev && prev.id === 'user-1' && 'accounts' in prev) {
                const updated = updater(prev as User);
                if (updated) {
                    localStorage.setItem('localUser-user-1', JSON.stringify(updated));
                }
                return updated;
            }
            return prev;
        });
    };

    const createInstantAccount = async (data: SignupData): Promise<User | null> => {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/auth/create-instant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Instant account creation failed');
        }
        
        const { token: newToken, user } = await response.json();
        localStorage.setItem('token', newToken);
        setCurrentUser(user);
        return user;
    };
    
    const resetUserData = async () => {
        if (!currentUser) return;

        // Handle local-only reset for the original demo user
        if (currentUser.id === 'user-1') {
            localStorage.removeItem('localUser-user-1');
            logout();
            return;
        }

        // Handle persistent reset for cloned users
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/users/${currentUser.id}/reset`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to reset account.");
            }
            // Successfully reset, now refresh the user state from server
            await checkAuthStatus();
        } catch (error) {
            console.error("Reset account error:", error);
            throw error;
        }
    };


    return (
        <AuthContext.Provider value={{ currentUser, loadingAuth, login, logout, signup, updateUser, addNotification, checkAuthStatus, readNotification, deleteNotification, deleteAccount, updateAlexLocally, createInstantAccount, resetUserData }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const isAdmin = (user: User | Admin | null): user is Admin => {
    return user !== null && 'username' in user && !('accounts' in user);
};