
import React, { useState, useEffect } from 'react';
import PageHeader from './PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import ConfirmationModal from './ConfirmationModal';

const ProfilePage: React.FC = () => {
    const { currentUser, updateUser, deleteAccount } = useAuth();
    const user = currentUser as User;
    
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    
    const [feedback, setFeedback] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setFullName(user.fullName);
            setEmail(user.email);
            setPhone(user.phone);
            setDob(user.dob || '');
        }
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFeedback('');

        if (password && password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password && password.length < 6) {
            setError("New password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        try {
            const updateData: any = {};
            if (username !== user.username) updateData.username = username;
            if (fullName !== user.fullName) updateData.fullName = fullName;
            if (email !== user.email) updateData.email = email;
            if (phone !== user.phone) updateData.phone = phone;
            if (dob !== user.dob) updateData.dob = dob;
            if (password) updateData.password = password;

            if (Object.keys(updateData).length > 0) {
                 await updateUser(user.id, updateData);
                 setFeedback('Profile updated successfully!');
                 setPassword('');
                 setConfirmPassword('');
            } else {
                setFeedback('No changes to save.');
            }

        } catch(err: any) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
            setTimeout(() => {
                setFeedback('');
                setError('');
            }, 3000);
        }
    };
    
    const handleDelete = async () => {
        setShowDeleteConfirm(false);
        setError('');
        setFeedback('');
        setLoading(true);
        try {
            await deleteAccount();
        } catch(err: any) {
            setError(err.message || 'Failed to delete account');
            setLoading(false);
        }
    }

    if (!user) {
        return null; // Should not happen if routed correctly
    }

    return (
        <div className="bg-slate-50 min-h-full">
            <PageHeader title="Profile" />
            <div className="p-4">
                <form onSubmit={handleSave} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                    <h2 className="text-xl font-bold text-gray-800">Edit Profile</h2>
                    
                    <div>
                         <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red" />
                    </div>

                    <div>
                        <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" id="fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red" />
                    </div>

                     <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red" />
                    </div>

                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red" />
                    </div>

                     <div>
                        <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input type="date" id="dob" value={dob} onChange={(e) => setDob(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red" />
                    </div>
                     
                     <hr/>

                     <h3 className="text-lg font-semibold text-gray-700 pt-2">Change Password</h3>
                     <div>
                        <label htmlFor="password"className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input type="password" id="password" placeholder="Leave blank to keep current password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red" />
                     </div>
                     <div>
                        <label htmlFor="confirmPassword"className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input type="password" id="confirmPassword" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red" />
                     </div>


                     {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                     {feedback && <p className="text-green-600 text-sm text-center">{feedback}</p>}
                    
                     <button type="submit" disabled={loading} className="w-full bg-wells-red text-white font-bold py-3 rounded-md hover:bg-wells-dark-red transition duration-300 disabled:opacity-50">
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>

                    <div className="mt-6 pt-6 border-t border-red-200">
                        <h3 className="text-lg font-semibold text-red-700">Delete Account</h3>
                        <p className="text-sm text-gray-600 my-2">This action is permanent and cannot be undone. All your data, including accounts and transaction history, will be permanently removed.</p>
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            disabled={loading}
                            className="w-full bg-red-600 text-white font-bold py-3 rounded-md hover:bg-red-800 transition duration-300 disabled:opacity-50"
                        >
                            Delete My Account
                        </button>
                    </div>
                   
                </form>
            </div>
            <ConfirmationModal
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Confirm Account Deletion"
                message="Are you absolutely sure you want to delete your account? This is irreversible."
            />
        </div>
    );
};

export default ProfilePage;