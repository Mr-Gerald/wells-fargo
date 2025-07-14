import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../types';

const NotificationSender: React.FC = () => {
    const { addNotification } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [message, setMessage] = useState('');
    const [feedback, setFeedback] = useState('');

     useEffect(() => {
        const fetchUsers = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                    if (data.length > 0) {
                        setSelectedUserId(data[0].id);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch users", error);
            }
        };
        fetchUsers();
    }, []);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUserId || !message) {
            setFeedback('Please select a user and enter a message.');
            return;
        }
        addNotification(selectedUserId, message);
        setFeedback(`Notification sent to ${users.find(u => u.id === selectedUserId)?.username}!`);
        setMessage('');
        setTimeout(() => setFeedback(''), 3000);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="user-select" className="block text-sm font-medium text-gray-700">
                    Select User
                </label>
                <select
                    id="user-select"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-wells-red focus:border-wells-red sm:text-sm rounded-md"
                >
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.username}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Notification Message
                </label>
                <textarea
                    id="message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-wells-red focus:border-wells-red"
                    placeholder="Enter message. You can include links like https://..."
                />
            </div>
            <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
            >
                Send Notification
            </button>
            {feedback && <p className="text-green-600 text-sm text-center">{feedback}</p>}
        </form>
    );
};

export default NotificationSender;