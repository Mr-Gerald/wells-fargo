import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import UserManagement from './UserManagement';
import NotificationSender from './NotificationSender';
import VerificationQueue from './VerificationQueue';

const AdminHeader: React.FC<{ onLogout: () => void }> = ({ onLogout }) => (
    <header className="bg-slate-800 text-white p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <button
            onClick={onLogout}
            className="bg-wells-red hover:bg-wells-dark-red text-white font-semibold py-2 px-4 rounded"
        >
            Sign Out
        </button>
    </header>
);

const AdminPage: React.FC = () => {
    const { logout } = useAuth();

    return (
        <div className="bg-slate-100 min-h-screen">
            <AdminHeader onLogout={logout} />
            <main className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Management</h2>
                        <UserManagement />
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Send Notification</h2>
                        <NotificationSender />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-1">
                     <h2 className="text-2xl font-semibold mb-4 text-gray-800">Identity Verification Queue</h2>
                    <VerificationQueue />
                </div>
            </main>
        </div>
    );
};

export default AdminPage;