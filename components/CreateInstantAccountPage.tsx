
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from './PageHeader';

const CreateInstantAccountPage: React.FC = () => {
    const { createInstantAccount } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        ssn: '',
        password: '',
        confirmPassword: '',
        dob: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        setError('');
        setLoading(true);

        try {
            await createInstantAccount({
                username: formData.username,
                password: formData.password,
                fullName: formData.fullName,
                email: formData.email,
                phone: formData.phone,
                ssn: formData.ssn,
                dob: formData.dob,
            });
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    const isSignupDisabled = !formData.username || !formData.password || !formData.confirmPassword || !formData.fullName || !formData.email || !formData.phone || !formData.ssn || !formData.dob || formData.password.length < 6 || formData.password !== formData.confirmPassword || loading;

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F8F8]">
            <PageHeader title="Create Instant Account" />
            
            <main className="flex-1 bg-white p-6">
                <h2 style={{fontFamily: 'Georgia, serif'}} className="text-2xl text-gray-800 mb-2">Generate a Demo Account</h2>
                <p className="text-gray-600 mb-6">Create a new, persistent user pre-loaded with Alex's transaction data.</p>

                {loading ? (
                     <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wells-red"></div>
                        <p className="mt-4 text-gray-600">Generating your new account...</p>
                    </div>
                ) : (
                    <>
                        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                        
                        <form onSubmit={handleSignup} className="space-y-4">
                            <div className="relative h-12">
                                <input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleChange} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                <label htmlFor="fullName" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${formData.fullName ? 'transform -translate-y-2.5 scale-75' : ''}`}>Full Name</label>
                            </div>
                            <div className="relative h-12">
                                <input id="username" name="username" type="text" value={formData.username} onChange={handleChange} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                <label htmlFor="username" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${formData.username ? 'transform -translate-y-2.5 scale-75' : ''}`}>Username</label>
                            </div>
                             <div className="relative h-12">
                                <input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base text-gray-700" />
                                <label htmlFor="dob" className={`absolute left-3 bg-white px-1 -top-2 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none transform -translate-y-0.5 scale-75`}>Date of Birth</label>
                            </div>
                            <div className="relative h-12">
                                <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                <label htmlFor="email" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${formData.email ? 'transform -translate-y-2.5 scale-75' : ''}`}>Email Address</label>
                            </div>
                            <div className="relative h-12">
                                <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                <label htmlFor="phone" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${formData.phone ? 'transform -translate-y-2.5 scale-75' : ''}`}>Phone Number</label>
                            </div>
                            <div className="relative h-12">
                                <input id="ssn" name="ssn" type="text" value={formData.ssn} onChange={handleChange} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                <label htmlFor="ssn" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${formData.ssn ? 'transform -translate-y-2.5 scale-75' : ''}`}>Social Security Number (SSN)</label>
                            </div>
                            <div className="relative h-12">
                                <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                <label htmlFor="password" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${formData.password ? 'transform -translate-y-2.5 scale-75' : ''}`}>Password</label>
                            </div>
                            <div className="relative h-12">
                                <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                <label htmlFor="confirmPassword" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${formData.confirmPassword ? 'transform -translate-y-2.5 scale-75' : ''}`}>Confirm Password</label>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className={`w-full font-bold py-3 rounded-full transition duration-300 ${isSignupDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-wells-red text-white hover:bg-wells-dark-red'}`}
                                    disabled={isSignupDisabled}
                                >
                                    Generate Account
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </main>
        </div>
    );
};

export default CreateInstantAccountPage;