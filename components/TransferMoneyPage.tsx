
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from './PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
};

const TransferMoneyPage: React.FC = () => {
    const { currentUser, checkAuthStatus } = useAuth();
    const navigate = useNavigate();
    const user = currentUser as User;
    
    const [activeTab, setActiveTab] = useState('internal');
    const [fromAccount, setFromAccount] = useState(user.accounts[0]?.id || '');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Internal transfer state
    const [toAccount, setToAccount] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [searching, setSearching] = useState(false);
    
    // External transfer state
    const [extData, setExtData] = useState({
        recipientName: '',
        routingNumber: '',
        accountNumber: '',
        accountType: 'checking'
    });

    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    useEffect(() => {
        const searchUsers = async () => {
            if (debouncedSearchTerm) {
                setSearching(true);
                try {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`/api/users/search?q=${debouncedSearchTerm}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                        const data = await response.json();
                        setSearchResults(data);
                    }
                } catch (err) {
                    console.error("Search failed", err);
                } finally {
                    setSearching(false);
                }
            } else {
                setSearchResults([]);
            }
        };
        searchUsers();
    }, [debouncedSearchTerm]);
    
    const handleSelectUser = (result: any) => {
        setSelectedUser(result);
        setSearchTerm(result.username);
        setSearchResults([]);
        if (result.accounts && result.accounts.length > 0) {
            setToAccount(result.accounts[0].id);
        }
    }
    
    const handleExtChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setExtData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (parseFloat(amount) <= 0) {
            setError('Amount must be positive.');
            return;
        }

        const fromAcc = user.accounts.find(a => a.id === fromAccount);
        if (fromAcc && fromAcc.balance < parseFloat(amount)) {
            setError('Insufficient funds for this transfer.');
            return;
        }
        
        setLoading(true);

        const apiEndpoint = activeTab === 'internal' ? '/api/transfers' : '/api/transfers/external';
        const body = activeTab === 'internal' 
            ? JSON.stringify({ fromAccountId: fromAccount, toAccountId: toAccount, amount: parseFloat(amount) })
            : JSON.stringify({ fromAccountId: fromAccount, amount: parseFloat(amount), recipient: extData });

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: body
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Transfer failed.');
            }
            
            await checkAuthStatus();
            navigate(`/account/${result.transaction.accountId}/transaction/${result.transaction.id}`, {
                state: { message: 'Transfer successful!' }
            });

        } catch(err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    const isInternalSubmitDisabled = loading || !selectedUser || !fromAccount || !toAccount || !amount;
    const isExternalSubmitDisabled = loading || !extData.recipientName || !extData.routingNumber || !extData.accountNumber || !amount;

    return (
        <div className="bg-slate-50 min-h-full">
            <PageHeader title="Transfer Money" />
            
            <div className="flex border-b border-gray-300">
                <button 
                    onClick={() => setActiveTab('internal')}
                    className={`flex-1 py-3 text-center font-semibold ${activeTab === 'internal' ? 'bg-white text-wells-red border-b-2 border-wells-red' : 'bg-gray-200 text-gray-600'}`}
                >
                    Wells Fargo Accounts
                </button>
                <button
                     onClick={() => setActiveTab('external')}
                     className={`flex-1 py-3 text-center font-semibold ${activeTab === 'external' ? 'bg-white text-wells-red border-b-2 border-wells-red' : 'bg-gray-200 text-gray-600'}`}
                >
                    ACH / Wire Transfer
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-6">
                <div>
                    <label htmlFor="fromAccount" className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <select id="fromAccount" value={fromAccount} onChange={e => setFromAccount(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red">
                        {user.accounts.map(account => (
                        <option key={account.id} value={account.id}>{account.name} ...{account.numberSuffix} ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(account.balance)})</option>
                        ))}
                    </select>
                </div>

                {activeTab === 'internal' && (
                    <>
                        <div className="relative">
                            <label htmlFor="searchUser" className="block text-sm font-medium text-gray-700 mb-1">To (Search by Username)</label>
                            <input
                                type="text"
                                id="searchUser"
                                placeholder="Enter a username to find a recipient"
                                value={searchTerm}
                                onChange={e => {
                                    setSearchTerm(e.target.value);
                                    setSelectedUser(null);
                                }}
                                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red"
                                autoComplete="off"
                            />
                            {(searching || searchResults.length > 0) && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                    {searching && <div className="p-3 text-gray-500">Searching...</div>}
                                    {!searching && searchResults.map(result => (
                                        <div key={result.id} onClick={() => handleSelectUser(result)} className="p-3 hover:bg-gray-100 cursor-pointer">
                                            <p className="font-semibold">{result.username}</p>
                                            <p className="text-sm text-gray-600">{result.fullName}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedUser && (
                             <div>
                                <label htmlFor="toAccount" className="block text-sm font-medium text-gray-700 mb-1">Recipient's Account</label>
                                <select id="toAccount" value={toAccount} onChange={e => setToAccount(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red">
                                    {selectedUser.accounts.map((account:any) => (
                                    <option key={account.id} value={account.id}>{account.name} ...{account.numberSuffix}</option>
                                    ))}
                                </select>
                             </div>
                        )}
                    </>
                )}
                
                {activeTab === 'external' && (
                    <>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label>
                            <input type="text" name="recipientName" value={extData.recipientName} onChange={handleExtChange} className="w-full p-3 border border-gray-300 rounded-md" required />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Routing Number (ABA)</label>
                            <input type="text" name="routingNumber" value={extData.routingNumber} onChange={handleExtChange} className="w-full p-3 border border-gray-300 rounded-md" required />
                         </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                            <input type="text" name="accountNumber" value={extData.accountNumber} onChange={handleExtChange} className="w-full p-3 border border-gray-300 rounded-md" required />
                         </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                            <select name="accountType" value={extData.accountType} onChange={handleExtChange} className="w-full p-3 border border-gray-300 rounded-md" required>
                                <option value="checking">Checking</option>
                                <option value="savings">Savings</option>
                            </select>
                         </div>
                    </>
                )}
                
                 <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">$</div>
                        <input type="number" id="amount" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-7 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red" required />
                    </div>
                </div>

                <div>
                    <button type="submit" disabled={activeTab === 'internal' ? isInternalSubmitDisabled : isExternalSubmitDisabled} className="w-full bg-wells-red text-white font-bold py-3 rounded-md hover:bg-wells-dark-red transition duration-300 disabled:opacity-50">
                        {loading ? 'Sending...' : 'Review Transfer'}
                    </button>
                </div>
                
                {error && <p className="mt-4 text-center text-red-500">{error}</p>}
            </form>
        </div>
    );
};

export default TransferMoneyPage;