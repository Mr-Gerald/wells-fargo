


import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SignupPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [ssn, setSsn] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [signupSuccess, setSignupSuccess] = useState(false);
    const { signup } = useAuth();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }
        setError('');
        setLoading(true);

        try {
            await signup({ username, password, fullName, email, phone, ssn });
            // Artificial delay for a more realistic experience
            setTimeout(() => {
                setSignupSuccess(true);
                setLoading(false);
            }, 2500);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    const isSignupDisabled = !username || !password || !confirmPassword || !fullName || !email || !phone || !ssn || password.length < 6 || password !== confirmPassword || loading;

    return (
        <div className="flex flex-col min-h-screen bg-[#F8F8F8]">
            <header className="bg-wells-red text-white flex justify-center items-center p-4 shadow-md">
                <h1 className="text-xl font-bold tracking-wider">WELLS FARGO</h1>
            </header>
            <div className="h-1 bg-yellow-400"></div>

            <main className="flex-1 bg-white p-6">
                {signupSuccess ? (
                    <div className="text-center py-10 animate-fade-in">
                        <h2 style={{fontFamily: 'Georgia, serif'}} className="text-3xl text-green-600 mb-4">Enrollment Successful!</h2>
                        <p className="text-gray-700 mb-2">Your Wells Fargo account has been created.</p>
                        <p className="text-gray-700 mb-6">A confirmation email has been sent to <strong>{email}</strong>.</p>
                        <Link to="/login" className="w-full max-w-xs mx-auto inline-block font-bold py-3 rounded-full transition duration-300 bg-wells-red text-white hover:bg-wells-dark-red">
                            Proceed to Sign On
                        </Link>
                    </div>
                ) : (
                    <>
                        <h2 style={{fontFamily: 'Georgia, serif'}} className="text-4xl text-gray-800 mb-2">Create Account</h2>
                        <p className="text-gray-600 mb-6">Join Wells Fargo today.</p>

                        {loading ? (
                             <div className="flex flex-col items-center justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wells-red"></div>
                                <p className="mt-4 text-gray-600">Creating your account securely...</p>
                            </div>
                        ) : (
                            <>
                                {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                                
                                <form onSubmit={handleSignup} className="space-y-4">
                                    <div className="relative h-12">
                                        <input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                        <label htmlFor="fullName" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${fullName ? 'transform -translate-y-2.5 scale-75' : ''}`}>Full Name</label>
                                    </div>
                                    <div className="relative h-12">
                                        <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                        <label htmlFor="username" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${username ? 'transform -translate-y-2.5 scale-75' : ''}`}>Username</label>
                                    </div>
                                    <div className="relative h-12">
                                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                        <label htmlFor="email" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${email ? 'transform -translate-y-2.5 scale-75' : ''}`}>Email Address</label>
                                    </div>
                                    <div className="relative h-12">
                                        <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                        <label htmlFor="phone" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${phone ? 'transform -translate-y-2.5 scale-75' : ''}`}>Phone Number</label>
                                    </div>
                                    <div className="relative h-12">
                                        <input id="ssn" type="text" value={ssn} onChange={(e) => setSsn(e.target.value)} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                        <label htmlFor="ssn" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${ssn ? 'transform -translate-y-2.5 scale-75' : ''}`}>Social Security Number (SSN)</label>
                                    </div>
                                    <div className="relative h-12">
                                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                        <label htmlFor="password" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${password ? 'transform -translate-y-2.5 scale-75' : ''}`}>Password</label>
                                    </div>
                                    <div className="relative h-12">
                                        <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder=" " className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base" />
                                        <label htmlFor="confirmPassword" className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${confirmPassword ? 'transform -translate-y-2.5 scale-75' : ''}`}>Confirm Password</label>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            className={`w-full font-bold py-3 rounded-full transition duration-300 ${isSignupDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-wells-red text-white hover:bg-wells-dark-red'}`}
                                            disabled={isSignupDisabled}
                                        >
                                            Sign Up
                                        </button>
                                    </div>
                                </form>
                                <div className="text-center mt-6">
                                    <Link to="/login" className="text-sm text-wells-red font-semibold hover:underline">
                                        Already have an account? Sign On
                                    </Link>
                                </div>
                            </>
                        )}
                    </>
                )}
            </main>

            <footer className="bg-[#F8F8F8] p-6 text-xs text-gray-500 space-y-4 mt-auto">
                 <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <a href="#" className="hover:underline">About Wells Fargo</a>
                    <a href="#" className="hover:underline">Report Email Fraud</a>
                    <a href="#" className="hover:underline">Online Access Agreement</a>
                    <a href="#" className="hover:underline">Security Center</a>
                    <a href="#" className="hover:underline">Privacy, Cookies, Security & Legal</a>
                    <a href="#" className="hover:underline">Sitemap</a>
                    <a href="#" className="hover:underline">Do not sell or share my personal information</a>
                    <a href="#" className="hover:underline">Give Us Feedback</a>
                    <a href="#" className="hover:underline">Notice of Data Collection</a>
                </div>
                <hr className="border-gray-300"/>
                <p>© 1999 - 2025 Wells Fargo. All rights reserved. NMLSR ID 399801</p>
            </footer>
        </div>
    );
};

export default SignupPage;