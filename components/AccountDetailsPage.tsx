
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { TransactionCategoryIcon, SearchIcon, FilterIcon } from '../constants';
import { BackArrowIcon } from './PageHeader';
import { Transaction, User, Account } from '../types';
import { useAuth } from '../contexts/AuthContext';

const TransactionRow: React.FC<{ transaction: Transaction, accountId: string }> = ({ transaction, accountId }) => {
    const formatCurrency = (amount: number) => {
        const sign = amount > 0 ? '+' : '';
        return `${sign}${amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
        })}`;
    };

    const amountColor = transaction.status === 'On Hold' ? 'text-orange-500' : (transaction.amount > 0 ? 'text-green-600' : 'text-gray-800');

    return (
        <Link to={`/account/${accountId}/transaction/${transaction.id}`} className="flex items-center py-4 border-b border-gray-200 hover:bg-gray-50">
            <div className="mr-4">
                <TransactionCategoryIcon category={transaction.category} />
            </div>
            <div className="flex-1">
                <p className="font-semibold text-gray-800">{transaction.description}</p>
                <p className={`text-sm ${transaction.status === 'Pending' || transaction.status === 'On Hold' || transaction.status === 'Processing' ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>{transaction.date}</p>
            </div>
            <p className={`font-semibold ${amountColor}`}>{formatCurrency(transaction.amount)}</p>
        </Link>
    );
};

const initialFilterState = {
    type: 'all' as 'all' | 'credit' | 'debit',
    status: ['Completed', 'Pending', 'On Hold', 'Processing'] as Transaction['status'][],
    startDate: '',
    endDate: '',
};

const allStatuses: Transaction['status'][] = ['Completed', 'Pending', 'On Hold', 'Processing'];

const FilterModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: typeof initialFilterState) => void;
    onClear: () => void;
    currentFilters: typeof initialFilterState;
}> = ({ isOpen, onClose, onApply, onClear, currentFilters }) => {
    const [localFilters, setLocalFilters] = useState(currentFilters);

    useEffect(() => {
        setLocalFilters(currentFilters);
    }, [currentFilters]);

    if (!isOpen) return null;

    const handleStatusChange = (status: Transaction['status']) => {
        setLocalFilters(prev => {
            const newStatus = prev.status.includes(status)
                ? prev.status.filter(s => s !== status)
                : [...prev.status, status];
            return { ...prev, status: newStatus };
        });
    };
    
    const handleApply = () => {
        onApply(localFilters);
    };
    
    const handleClear = () => {
        setLocalFilters(initialFilterState);
        onClear();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-sm" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Filter Transactions</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                </header>
                <main className="p-4 space-y-4">
                    <div>
                        <h3 className="font-semibold mb-2">Type</h3>
                        <div className="flex space-x-4">
                             {['all', 'credit', 'debit'].map(type => (
                                <label key={type} className="flex items-center capitalize">
                                    <input type="radio" name="type" value={type} checked={localFilters.type === type} onChange={(e) => setLocalFilters(p => ({...p, type: e.target.value as any}))} className="h-4 w-4 text-wells-red focus:ring-wells-red"/>
                                    <span className="ml-2">{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold mb-2">Status</h3>
                        <div className="grid grid-cols-2 gap-2">
                             {allStatuses.map(status => (
                                <label key={status} className="flex items-center">
                                    <input type="checkbox" checked={localFilters.status.includes(status as any)} onChange={() => handleStatusChange(status as any)} className="h-4 w-4 text-wells-red focus:ring-wells-red rounded"/>
                                    <span className="ml-2">{status}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">Date Range</h3>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label htmlFor="startDate" className="text-sm">Start Date</label>
                                <input id="startDate" type="date" value={localFilters.startDate} onChange={e => setLocalFilters(p => ({...p, startDate: e.target.value}))} className="w-full p-2 border rounded-md"/>
                             </div>
                             <div>
                                <label htmlFor="endDate" className="text-sm">End Date</label>
                                <input id="endDate" type="date" value={localFilters.endDate} onChange={e => setLocalFilters(p => ({...p, endDate: e.target.value}))} className="w-full p-2 border rounded-md"/>
                             </div>
                        </div>
                    </div>
                </main>
                <footer className="flex justify-between p-4 border-t">
                     <button onClick={handleClear} className="px-4 py-2 rounded-md bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300">Clear</button>
                    <button onClick={handleApply} className="px-4 py-2 rounded-md bg-wells-red text-white font-semibold hover:bg-wells-dark-red">Apply</button>
                </footer>
            </div>
        </div>
    );
};

const AccountDetailsPage: React.FC = () => {
    const { id: accountId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('Overview');
    
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [filters, setFilters] = useState(initialFilterState);

    const user = currentUser as User;
    const account = user.accounts.find(acc => acc.id === accountId);

    useEffect(() => {
        const fetchAllTransactions = async () => {
            if (!accountId) return;
            setLoading(true);
            try {
                // For Alex, transactions come from local state.
                if (user.id === 'user-1' && user.transactions) {
                    setAllTransactions(user.transactions[accountId] || []);
                } else {
                    const token = localStorage.getItem('token');
                    const response = await fetch(`/api/accounts/${accountId}/transactions`, {
                         headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Failed to fetch transactions');
                    const data: Transaction[] = await response.json();
                    setAllTransactions(data);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllTransactions();
    }, [accountId, user]); // Depend on `user` to refetch if Alex's local data changes
    
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);


    useEffect(() => {
        let tempTransactions = [...allTransactions];

        if (debouncedSearchTerm) {
            tempTransactions = tempTransactions.filter(tx =>
                tx.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                tx.merchant.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            );
        }

        if (filters.type !== 'all') {
            tempTransactions = tempTransactions.filter(tx => filters.type === 'credit' ? tx.amount > 0 : tx.amount < 0);
        }

        if (filters.status.length > 0 && filters.status.length < allStatuses.length) {
            tempTransactions = tempTransactions.filter(tx => filters.status.includes(tx.status));
        }

        if (filters.startDate) {
            tempTransactions = tempTransactions.filter(tx => new Date(tx.postedDate) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // Include the whole day
            tempTransactions = tempTransactions.filter(tx => new Date(tx.postedDate) <= endDate);
        }

        setTransactions(tempTransactions.sort((a,b) => new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()));
    }, [debouncedSearchTerm, filters, allTransactions]);


    if (!account) {
        return <div className="p-4 text-center">Account not found.</div>;
    }

    const formatCurrency = (amount: number) => {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
        });
    };
    
    const TabButton: React.FC<{ title: string }> = ({ title }) => (
        <button 
            onClick={() => setActiveTab(title)}
            className={`py-2 px-4 text-sm font-semibold ${activeTab === title ? 'text-wells-red border-b-2 border-wells-red' : 'text-gray-500'}`}
        >
            {title}
        </button>
    );

    return (
        <div className="bg-white min-h-full">
            <header className="bg-slate-50 p-4 sticky top-0 z-10 border-b border-gray-200">
                <div className="flex items-center">
                    <button onClick={() => navigate(-1)} className="mr-4 p-1">
                        <BackArrowIcon />
                    </button>
                    <div>
                        <h1 className="font-semibold text-sm text-gray-800">{account.name} ...{account.numberSuffix}</h1>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(account.balance)}</p>
                        <p className="text-xs text-gray-500">{account.subText}</p>
                    </div>
                </div>
                <div className="mt-4 flex justify-around border-b border-gray-300">
                    <TabButton title="Overview" />
                    <TabButton title="Manage Account" />
                    <TabButton title="Routing & Details" />
                </div>
            </header>
            
            {activeTab === 'Overview' && (
                <>
                <div className="p-4 bg-slate-50 border-b">
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-grow">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon />
                            </div>
                            <input
                                type="text"
                                placeholder="Search transactions..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-wells-red"
                            />
                        </div>
                        <button onClick={() => setShowFilterModal(true)} className="p-2 bg-white border border-gray-300 rounded-full hover:bg-gray-100">
                            <FilterIcon className="text-gray-600"/>
                        </button>
                    </div>
                </div>
                <div className="px-4">
                    {loading ? (
                       <p className="text-center py-8">Loading transactions...</p>
                    ) : (
                        <div>
                        {transactions.length > 0 ? (
                           transactions.map(tx => <TransactionRow key={tx.id} transaction={tx} accountId={accountId!} />)
                        ) : (
                           <p className="text-gray-500 text-center py-8">No transactions match your criteria.</p>
                        )}
                        </div>
                    )}
                </div>
                </>
            )}
            {activeTab === 'Manage Account' && (
                 <div className="p-4 text-gray-700 space-y-4">
                    <p className="font-semibold">Account Management</p>
                    <div className="p-3 bg-gray-100 rounded-lg">Turn Card On/Off</div>
                    <div className="p-3 bg-gray-100 rounded-lg">View/Manage Statements</div>
                    <div className="p-3 bg-gray-100 rounded-lg">Set Overdraft Protection</div>
                 </div>
            )}
            {activeTab === 'Routing & Details' && (
                <div className="p-4 text-gray-700 space-y-4">
                    <p className="font-semibold">Account & Routing Numbers</p>
                    <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm">Routing Number</p>
                        <p className="font-mono">121000248</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm">Account Number</p>
                        <p className="font-mono">...{account.numberSuffix}</p>
                    </div>
                </div>
            )}
            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                currentFilters={filters}
                onApply={(newFilters) => {
                  setFilters(newFilters);
                  setShowFilterModal(false);
                }}
                onClear={() => {
                  setFilters(initialFilterState);
                   setShowFilterModal(false);
                }}
            />
        </div>
    );
};

export default AccountDetailsPage;