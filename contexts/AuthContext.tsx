


import React, { createContext, useState, useContext, useCallback } from 'react';
import { User, Admin, Notification } from '../types';

type SignupData = {
    username: string;
    password: string;
    fullName: string;
    email: string;
    phone: string;
    ssn: string;
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
    login: (username: string, password: string) => Promise<User | Admin | null>;
    logout: () => void;
    signup: (data: SignupData) => Promise<User | null>;
    updateUser: (userId: string, data: UpdateUserData) => Promise<User | null>;
    addNotification: (userId: string, message: string) => Promise<void>;
    checkAuthStatus: () => Promise<void>;
    readNotification: (notificationId: string) => Promise<void>;
    deleteNotification: (notificationId: string) => Promise<void>;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | Admin | null>(null);
    const [loadingAuth, setLoadingAuth] = useState(true);

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
                    setCurrentUser(user);
                } else {
                    localStorage.removeItem('token');
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error('Auth check failed', error);
                localStorage.removeItem('token');
                setCurrentUser(null);
            }
        } else {
            setCurrentUser(null);
        }
        setLoadingAuth(false);
    }, []);

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
        setCurrentUser(user);
        return user;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
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

        // Do not log the user in. Just return the created user data.
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
        // Update current user in context if it's the same user
        if (currentUser && currentUser.id === updatedUser.id) {
             setCurrentUser(updatedUser);
        }
        return updatedUser;
    };

    const addNotification = async (userId: string, message: string) => {
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
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const updatedUser = await response.json();
                setCurrentUser(updatedUser);
            }
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const deleteNotification = async (notificationId: string) => {
        const token = localStorage.getItem('token');
        try {
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const updatedUser = await response.json();
                setCurrentUser(updatedUser);
            }
        } catch (error) {
            console.error("Failed to delete notification", error);
        }
    };

    const deleteAccount = async () => {
        const token = localStorage.getItem('token');
        if (!currentUser || 'accounts' in currentUser === false) return; // Only users can delete accounts

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


    return (
        <AuthContext.Provider value={{ currentUser, loadingAuth, login, logout, signup, updateUser, addNotification, checkAuthStatus, readNotification, deleteNotification, deleteAccount }}>
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