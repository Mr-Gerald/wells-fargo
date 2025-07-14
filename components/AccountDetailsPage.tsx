import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { TransactionCategoryIcon } from '../constants';
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
                <p className={`text-sm ${transaction.status === 'Pending' || transaction.status === 'On Hold' ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>{transaction.date}</p>
            </div>
            <p className={`font-semibold ${amountColor}`}>{formatCurrency(transaction.amount)}</p>
        </Link>
    );
};


const AccountDetailsPage: React.FC = () => {
    const { id: accountId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('Overview');
    
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const user = currentUser as User;
    const account = user.accounts.find(acc => acc.id === accountId);

    const fetchTransactions = useCallback(async (pageNum: number) => {
        if (loading || !hasMore || !accountId) return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/accounts/${accountId}/transactions?page=${pageNum}&limit=20`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch transactions');
            
            const newTransactions: Transaction[] = await response.json();

            setTransactions(prev => pageNum === 1 ? newTransactions : [...prev, ...newTransactions]);
            setHasMore(newTransactions.length > 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [accountId, loading, hasMore]);

    useEffect(() => {
        setTransactions([]);
        setPage(1);
        setHasMore(true);
        fetchTransactions(1);
    }, [accountId]);

    const loadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchTransactions(nextPage);
    };

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
                <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">All transactions</h2>
                    <div>
                        {transactions.length > 0 ? (
                           transactions.map(tx => <TransactionRow key={tx.id} transaction={tx} accountId={accountId!} />)
                        ) : (
                           <p className="text-gray-500 text-center py-8">No recent transactions.</p>
                        )}
                    </div>
                    {loading && <p className="text-center py-4">Loading...</p>}
                    {!loading && hasMore && (
                        <div className="text-center mt-4">
                            <button
                                onClick={loadMore}
                                className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-md hover:bg-gray-300 transition duration-300"
                            >
                                Load More
                            </button>
                        </div>
                    )}
                </div>
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
        </div>
    );
};

export default AccountDetailsPage;