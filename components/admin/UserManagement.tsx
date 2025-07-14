import React, { useState, useEffect } from 'react';
import { User } from '../../types';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const response = await fetch('/api/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    if (loading) return <p>Loading users...</p>;

    return (
        <div className="space-y-3 max-h-96 overflow-y-auto">
            {users.map((user: User) => (
                <div key={user.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
                    <p className="font-semibold text-gray-900">{user.username}</p>
                    <p className="text-sm text-gray-600">Full Name: {user.fullName}</p>
                    <p className="text-sm text-gray-600">Accounts: {user.accounts.length}</p>
                </div>
            ))}
        </div>
    );
};

export default UserManagement;