


import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MenuIconSvg = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const PasskeyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2a5 5 0 105 5 5 5 0 00-5-5zm0 8a3 3 0 113-3 3 3 0 01-3 3zm6 2h-1.1c-.2-1.2-.7-2.3-1.4-3.3.4-.2.8-.5 1.2-.8a6 6 0 00-7.4-7.4c-.3.4-.6.8-.8 1.2a7 7 0 00-3.3-1.4V3a6 6 0 00-6 6v1c0 1.1.9 2 2 2h1v1c0 .6.4 1 1 1h2v1c0 1.1.9 2 2 2h6v-1h-2v-1c0-.6.4-1 1-1h1c1.1 0 2-.9 2-2v-1a6 6 0 00-6-6zm-8 4H4v-1a4 4 0 014-4h1a4 4 0 014 4v1h-2v-1c0-.6-.4-1-1-1H8c-.6 0-1 .4-1 1v1z"/>
    </svg>
);

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
);


const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savePasskey, setSavePasskey] = useState(false);
  const [passkeyData, setPasskeyData] = useState<{username: string, password: string} | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };
  
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('wellsFargoPasskey');
      if (savedData) {
        setPasskeyData(JSON.parse(savedData));
      }
    } catch (e) {
      console.error("Could not parse passkey data from localStorage", e);
      localStorage.removeItem('wellsFargoPasskey');
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (
            isMenuOpen &&
            menuRef.current &&
            !menuRef.current.contains(event.target as Node) &&
            menuButtonRef.current &&
            !menuButtonRef.current.contains(event.target as Node)
        ) {
            setIsMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      if (user) {
        if (savePasskey) {
            localStorage.setItem('wellsFargoPasskey', JSON.stringify({ username, password }));
        } else {
             // If user logs in without 'save' checked, remove any existing passkey for that user.
             if (passkeyData && passkeyData.username === username) {
                 localStorage.removeItem('wellsFargoPasskey');
             }
        }

        if ('accounts' in user) {
          navigate('/');
        } else {
          navigate('/admin');
        }
      } else {
         setError('Invalid username or password.');
      }
    } catch (err: any) {
       setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasskeyLogin = async () => {
      if (!passkeyData) return;
      setLoading(true);
      setError('');
      try {
          const user = await login(passkeyData.username, passkeyData.password);
          if (user) {
              navigate('/');
          } else {
              setError('Passkey login failed. The saved credentials may be outdated.');
              localStorage.removeItem('wellsFargoPasskey'); // Clear invalid passkey
              setPasskeyData(null);
          }
      } catch (err: any) {
          setError(err.message || 'An unexpected error occurred during passkey login.');
      } finally {
          setLoading(false);
      }
  }

  const isSignOnDisabled = !username || !password || loading;
  const isPasskeyAvailable = !!passkeyData;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F8F8]">
        <header className="bg-wells-red text-white flex justify-center items-center p-4 shadow-md relative">
            <h1 className="text-xl font-bold tracking-wider">WELLS FARGO</h1>
            <button ref={menuButtonRef} onClick={() => setIsMenuOpen(prev => !prev)} aria-label="Open Menu" className="absolute right-4 top-1/2 -translate-y-1/2 p-1">
                <MenuIconSvg />
            </button>
        </header>
        <div className="h-1 bg-yellow-400"></div>

        {isMenuOpen && (
             <div ref={menuRef} className="absolute top-16 right-4 w-56 bg-white rounded-md shadow-lg py-2 z-50 animate-fade-in">
                <Link to="/signup" onClick={() => setIsMenuOpen(false)} className="block px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors">
                    Enroll
                </Link>
                <a href="#" className="block px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors">
                    Locations
                </a>
                <a href="#" className="block px-4 py-3 text-gray-800 hover:bg-gray-100 transition-colors">
                    Help
                </a>
            </div>
        )}

        <main className="flex-1 bg-white p-6">
            <h2 style={{fontFamily: 'Georgia, serif'}} className="text-4xl text-gray-800 mb-6 text-center">{getGreeting()}</h2>
            
            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="relative h-12">
                    <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full h-full px-3 pt-3 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base"
                        required
                        aria-label="Username"
                        placeholder=" " 
                    />
                    <label 
                        htmlFor="username" 
                        className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${username ? 'transform -translate-y-2.5 scale-75' : ''}`}
                    >
                        Username
                    </label>
                </div>

                <div className="relative h-12">
                    <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-full pl-3 pr-16 border border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-wells-red text-base"
                        required
                        aria-label="Password"
                        placeholder=" " 
                    />
                     <label 
                        htmlFor="password" 
                        className={`absolute left-3 top-3 text-gray-500 transition-all duration-200 ease-in-out pointer-events-none ${password ? 'transform -translate-y-2.5 scale-75' : ''}`}
                    >
                        Password
                    </label>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-wells-red font-semibold text-sm underline">
                        {showPassword ? 'Hide' : 'Show'}
                    </button>
                </div>

                <div className="pt-2 space-y-2">
                    <div className="flex items-center">
                        <input id="save-passkey" type="checkbox" checked={savePasskey} onChange={() => setSavePasskey(!savePasskey)} className="h-5 w-5 rounded border-gray-400 text-wells-red focus:ring-wells-red" />
                        <label htmlFor="save-passkey" className="ml-2 block text-sm text-gray-900">
                            Save username
                        </label>
                    </div>
                    <p className="text-xs text-gray-600">To help keep your account secure, save your username only on devices that aren't used by other people.</p>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        className={`w-full font-bold py-3 rounded-full transition duration-300 ${isSignOnDisabled ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-800 hover:bg-gray-400'}`}
                        disabled={isSignOnDisabled}
                    >
                        {loading && !passkeyData ? 'Signing On...' : 'Sign on'}
                    </button>
                </div>
            </form>
            
            <div className="my-3 text-center text-sm text-gray-500">or</div>

            <button
                type="button"
                onClick={handlePasskeyLogin}
                className={`w-full bg-white text-black font-bold py-3 rounded-full border flex items-center justify-center transition-colors ${isPasskeyAvailable ? 'border-black hover:bg-gray-100' : 'border-gray-400 text-gray-400 cursor-not-allowed bg-gray-50'}`}
                disabled={!isPasskeyAvailable || loading}
            >
                <PasskeyIcon /> {loading && passkeyData ? 'Using passkey...' : 'Use a passkey'}
            </button>
            
            <p className="text-xs text-gray-600 mt-3 text-center">
                Don't have one? Create a passkey after signing on and skip the password next time.
            </p>

             <a href="#" className="flex items-center justify-center mt-6 text-wells-red font-semibold hover:underline">
                <ArrowRightIcon /> Forgot username or password?
            </a>

        </main>

        <section className="bg-white p-6">
            <div className="border border-gray-200 p-4">
                <p className="font-bold text-sm mb-2">Investment and Insurance Products are:</p>
                <ul className="list-disc list-inside space-y-3 text-sm text-gray-700">
                    <li>Not Insured by the FDIC or Any Federal Government Agency</li>
                    <li>Not a Deposit or Other Obligation of, or Guaranteed by, the Bank or Any Bank Affiliate</li>
                    <li>Subject to Investment Risks, Including Possible Loss of the Principal Amount Invested</li>
                </ul>
            </div>
            <p className="text-xs text-gray-600 mt-4">Deposit products offered by Wells Fargo Bank, N.A. Member FDIC.</p>
        </section>

        <footer className="bg-[#F8F8F8] p-6 text-xs text-gray-500 space-y-4">
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

export default LoginPage;