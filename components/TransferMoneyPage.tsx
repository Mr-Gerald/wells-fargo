

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from './PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import ReviewTransferModal from './ReviewTransferModal';

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
    const { currentUser, checkAuthStatus, updateAlexLocally } = useAuth();
    const navigate = useNavigate();
    const user = currentUser as User;
    
    const [activeTab, setActiveTab] = useState('internal');
    const [fromAccount, setFromAccount] = useState(user.accounts[0]?.id || '');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [transferDetailsForReview, setTransferDetailsForReview] = useState<any>(null);


    // Internal transfer state
    const [toAccount, setToAccount] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [searching, setSearching] = useState(false);
    
    // External transfer state
    const [extTransferMode, setExtTransferMode] = useState('ach'); // 'ach' or 'wire'
    const [wireType, setWireType] = useState('domestic'); // 'domestic' or 'international'
    const [extData, setExtData] = useState({
        recipientName: '',
        routingNumber: '',
        accountNumber: '',
        accountType: 'checking',
        recipientAddress: '',
        recipientCity: '',
        recipientState: '',
        recipientZip: '',
        recipientCountry: 'United States',
        bankName: '',
        bankAddress: '',
        swiftCode: '',
        iban: '',
        transferPurpose: ''
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

    const handleReviewSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!amount || parseFloat(amount) <= 0) {
            setError('Amount must be a positive number.');
            return;
        }

        const fromAcc = user.accounts.find(a => a.id === fromAccount);
        if (fromAcc && fromAcc.balance < parseFloat(amount)) {
            setError('Insufficient funds for this transfer.');
            return;
        }
        
        let details = {};
        if (activeTab === 'internal' && selectedUser) {
            details = {
                fromAccountName: fromAcc?.name,
                fromAccountSuffix: fromAcc?.numberSuffix,
                toName: selectedUser.fullName,
                amount: amount,
                type: 'Internal Transfer'
            };
        } else if (activeTab === 'external') {
            details = {
                fromAccountName: fromAcc?.name,
                fromAccountSuffix: fromAcc?.numberSuffix,
                toName: extData.recipientName,
                amount: amount,
                type: extTransferMode === 'wire' ? `${wireType} wire` : 'ach'
            };
        }

        setTransferDetailsForReview(details);
        setShowReviewModal(true);
    };
    
    const handleConfirmTransfer = async () => {
        setLoading(true);
        setError('');
        const apiEndpoint = activeTab === 'internal' ? '/api/transfers' : '/api/transfers/external';
        const body = activeTab === 'internal' 
            ? JSON.stringify({ fromAccountId: fromAccount, toAccountId: toAccount, amount: parseFloat(amount) })
            : JSON.stringify({ 
                fromAccountId: fromAccount, 
                amount: parseFloat(amount), 
                recipient: extData,
                transferDetails: { type: extTransferMode, wireType: extTransferMode === 'wire' ? wireType : undefined }
            });

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
            
            // Local state update for Alex (demo user)
            if (user.id === 'user-1') {
                updateAlexLocally(prev => {
                    if (!prev) return null;
                    const updatedAlex = JSON.parse(JSON.stringify(prev)); // Deep copy
                    const fromAccountIndex = updatedAlex.accounts.findIndex((a:any) => a.id === fromAccount);

                    if (result.transaction.status === 'Completed' && fromAccountIndex !== -1) {
                         updatedAlex.accounts[fromAccountIndex].balance -= parseFloat(amount);
                    }
                   
                    if (!updatedAlex.transactions[fromAccount]) {
                        updatedAlex.transactions[fromAccount] = [];
                    }
                    updatedAlex.transactions[fromAccount].unshift(result.transaction);

                    if (result.notificationMessage) {
                        if (!updatedAlex.notifications) updatedAlex.notifications = [];
                         updatedAlex.notifications.unshift({
                            id: `n-local-${Date.now()}`,
                            message: result.notificationMessage,
                            date: new Date().toISOString(),
                            isRead: false
                        });
                    }
                    return updatedAlex;
                });
            } else {
                 await checkAuthStatus();
            }
            
            setShowReviewModal(false);
            navigate(`/account/${result.transaction.accountId}/transaction/${result.transaction.id}`, {
                state: { message: result.message }
            });

        } catch(err: any) {
            setError(err.message);
            setShowReviewModal(false); // Close modal on error to show the message on page
        } finally {
            setLoading(false);
        }
    };
    
    const isInternalSubmitDisabled = loading || !selectedUser || !fromAccount || !toAccount || !amount;
    const isExternalSubmitDisabled = () => {
        if(loading || !fromAccount || !amount) return true;
        if(extTransferMode === 'ach') {
            return !extData.recipientName || !extData.routingNumber || !extData.accountNumber;
        }
        if(extTransferMode === 'wire' && wireType === 'domestic') {
            return !extData.recipientName || !extData.routingNumber || !extData.accountNumber || !extData.bankName;
        }
        if(extTransferMode === 'wire' && wireType === 'international') {
            return !extData.recipientName || !extData.recipientCountry || !extData.bankName || !extData.swiftCode || !extData.iban;
        }
        return false;
    };


    const renderExternalForm = () => (
        <div className="space-y-4">
            <div className="flex bg-gray-200 p-1 rounded-full">
                <button type="button" onClick={() => setExtTransferMode('ach')} className={`flex-1 py-1.5 rounded-full text-sm font-semibold transition-all ${extTransferMode === 'ach' ? 'bg-white shadow text-wells-red' : 'text-gray-600'}`}>ACH</button>
                <button type="button" onClick={() => setExtTransferMode('wire')} className={`flex-1 py-1.5 rounded-full text-sm font-semibold transition-all ${extTransferMode === 'wire' ? 'bg-white shadow text-wells-red' : 'text-gray-600'}`}>Wire</button>
            </div>

            {extTransferMode === 'ach' && (
                <div className="animate-fade-in space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">ACH Transfer Details</h3>
                     <div><label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label><input type="text" name="recipientName" value={extData.recipientName} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                     <div><label className="block text-sm font-medium text-gray-700 mb-1">Routing Number (ABA)</label><input type="text" name="routingNumber" value={extData.routingNumber} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                     <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label><input type="text" name="accountNumber" value={extData.accountNumber} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                     <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label><select name="accountType" value={extData.accountType} onChange={handleExtChange} className="w-full p-2 border rounded-md"><option value="checking">Checking</option><option value="savings">Savings</option></select></div>
                </div>
            )}

            {extTransferMode === 'wire' && (
                <div className="animate-fade-in space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Wire Transfer Details</h3>
                    <div className="flex bg-gray-200 p-1 rounded-full">
                        <button type="button" onClick={() => setWireType('domestic')} className={`flex-1 py-1.5 rounded-full text-sm font-semibold transition-all ${wireType === 'domestic' ? 'bg-white shadow text-wells-red' : 'text-gray-600'}`}>Domestic</button>
                        <button type="button" onClick={() => setWireType('international')} className={`flex-1 py-1.5 rounded-full text-sm font-semibold transition-all ${wireType === 'international' ? 'bg-white shadow text-wells-red' : 'text-gray-600'}`}>International</button>
                    </div>

                    <p className="text-xs text-gray-600 p-2 bg-yellow-100 border border-yellow-300 rounded-md">Note: Wire transfers may be subject to additional security verification and fees.</p>
                    
                    {wireType === 'domestic' && (
                         <div className="animate-fade-in space-y-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label><input type="text" name="recipientName" value={extData.recipientName} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Recipient Address</label><input type="text" name="recipientAddress" placeholder="Street, City, State, Zip" value={extData.recipientAddress} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Recipient Bank Name</label><input type="text" name="bankName" value={extData.bankName} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Routing Number (ABA)</label><input type="text" name="routingNumber" value={extData.routingNumber} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label><input type="text" name="accountNumber" value={extData.accountNumber} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                         </div>
                    )}
                    
                     {wireType === 'international' && (
                         <div className="animate-fade-in space-y-4">
                            <h4 className="font-semibold text-gray-600">Recipient Details</h4>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Recipient Name</label><input type="text" name="recipientName" value={extData.recipientName} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Recipient Full Address</label><input type="text" name="recipientAddress" placeholder="Street, City, Province, Postal Code" value={extData.recipientAddress} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Recipient Country</label><input type="text" name="recipientCountry" value={extData.recipientCountry} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                            <hr/>
                            <h4 className="font-semibold text-gray-600">Bank Details</h4>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Recipient Bank Name</label><input type="text" name="bankName" value={extData.bankName} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">SWIFT/BIC Code</label><input type="text" name="swiftCode" value={extData.swiftCode} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">IBAN or Account Number</label><input type="text" name="iban" value={extData.iban} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                            <hr/>
                            <div><label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Transfer</label><input type="text" name="transferPurpose" value={extData.transferPurpose} onChange={handleExtChange} className="w-full p-2 border rounded-md" /></div>
                         </div>
                    )}
                </div>
            )}
        </div>
    );
    
    const buttonText = activeTab === 'external' && extTransferMode === 'wire' 
        ? 'Initiate Wire Transfer' 
        : 'Review Transfer';

    return (
        <div className="bg-slate-50 min-h-full">
            <PageHeader title="Transfer Money" />
            
            <div className="flex border-b border-gray-300">
                <button 
                    onClick={() => setActiveTab('internal')}
                    className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'internal' ? 'bg-white text-wells-red border-b-2 border-wells-red' : 'bg-gray-200 text-gray-600'}`}
                >
                    Wells Fargo Accounts
                </button>
                <button
                     onClick={() => setActiveTab('external')}
                     className={`flex-1 py-3 text-center font-semibold transition-colors ${activeTab === 'external' ? 'bg-white text-wells-red border-b-2 border-wells-red' : 'bg-gray-200 text-gray-600'}`}
                >
                    External (ACH / Wire)
                </button>
            </div>
            
            <form onSubmit={handleReviewSubmit} className="p-4 space-y-6">
                <div>
                    <label htmlFor="fromAccount" className="block text-sm font-medium text-gray-700 mb-1">From</label>
                    <select id="fromAccount" value={fromAccount} onChange={e => setFromAccount(e.target.value)} className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red">
                        {user.accounts.map(account => (
                        <option key={account.id} value={account.id}>{account.name} ...{account.numberSuffix} ({new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(account.balance)})</option>
                        ))}
                    </select>
                </div>

                {activeTab === 'internal' ? (
                    <div className="animate-fade-in space-y-6">
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
                    </div>
                ) : <div className="animate-fade-in">{renderExternalForm()}</div>}
                
                 <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">$</div>
                        <input type="number" id="amount" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-7 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red" required />
                    </div>
                </div>

                <div>
                    <button type="submit" disabled={activeTab === 'internal' ? isInternalSubmitDisabled : isExternalSubmitDisabled()} className="w-full bg-wells-red text-white font-bold py-3 rounded-md hover:bg-wells-dark-red transition duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed">
                        {loading ? 'Processing...' : buttonText}
                    </button>
                </div>
                
                {error && <p className="mt-4 text-center text-red-500">{error}</p>}
            </form>

            <ReviewTransferModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onConfirm={handleConfirmTransfer}
                details={transferDetailsForReview}
                loading={loading}
            />
        </div>
    );
};

export default TransferMoneyPage;