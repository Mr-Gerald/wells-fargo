

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, Transaction, Account } from '../types';
import PageHeader from './PageHeader';
import { PrintIcon, ShareIcon } from '../constants';

const TransactionReceiptPage: React.FC = () => {
  const { id: accountId, txId } = useParams<{ id: string, txId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');


  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!accountId || !txId) return;
      setLoading(true);

      try {
        let tx, acc;
        if ((currentUser as User)?.id === 'user-1' && (currentUser as User)?.transactions) {
          const userTxs = (currentUser as User).transactions[accountId] || [];
          tx = userTxs.find(t => t.id === txId) || null;
          acc = (currentUser as User).accounts.find(a => a.id === accountId) || null;
        }
        
        if (!tx || !acc) {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/accounts/${accountId}/transactions/${txId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) {
            throw new Error('Transaction not found');
          }
          const data = await response.json();
          tx = data.transaction;
          acc = data.account;
        }

        setTransaction(tx);
        setAccount(acc);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactionDetails();
  }, [accountId, txId, currentUser]);
  
  const handlePrint = () => {
    window.print();
  }

  const handleShare = async () => {
    if (!transaction || !account) return;
    const shareData = {
      title: 'Wells Fargo Transaction Receipt',
      text: `Receipt for ${formatCurrency(transaction.amount)} transaction with ${transaction.merchant} on ${transaction.postedDate}. Status: ${transaction.status}.`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.text);
        alert('Receipt details copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader title="Receipt" />
        <div className="p-4 text-center">Loading receipt...</div>
      </>
    );
  }

  if (error || !account || !transaction) {
    return (
      <>
        <PageHeader title="Receipt" />
        <div className="p-4 text-center">{error || 'Transaction not found.'}</div>
      </>
    );
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };
  
  const getStatusInfo = (status: Transaction['status']) => {
    switch (status) {
        case 'Completed': return { color: 'text-green-600', bgColor: 'bg-green-100', borderColor: 'border-green-500' };
        case 'On Hold': return { color: 'text-orange-600', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-500' };
        case 'Pending': return { color: 'text-blue-600', bgColor: 'bg-blue-100', borderColor: 'border-blue-500' };
        case 'Processing': return { color: 'text-indigo-600', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-500' };
        default: return { color: 'text-gray-500', bgColor: 'bg-gray-100', borderColor: 'border-gray-500' };
    }
  };
  const statusInfo = getStatusInfo(transaction.status);
  const amountColor = transaction.status === 'On Hold' ? 'text-orange-500' : (transaction.amount > 0 ? 'text-green-600' : 'text-gray-900');

  return (
    <div className="bg-slate-50 min-h-full print:bg-white">
      <PageHeader title="Receipt" />

       {successMessage && (
        <div className="mx-4 mt-2 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center animate-fade-in">
            {successMessage}
        </div>
      )}

      <div className="p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 text-sm">Amount</p>
            <p className={`text-4xl font-bold ${amountColor}`}>{formatCurrency(transaction.amount)}</p>
            <p className={`mt-2 font-semibold ${statusInfo.color}`}>
                {transaction.status}
            </p>
        </div>

        {transaction.status === 'On Hold' && (
            <div className={`${statusInfo.bgColor} border-l-4 ${statusInfo.borderColor} ${statusInfo.color} p-4 rounded-b-lg shadow-sm -mt-2`}>
                <p className="font-bold">Action Required</p>
                <p className="text-sm">To protect your account, these funds are on hold until you verify your identity. Please complete the verification to release the funds.</p>
                <button
                    onClick={() => navigate(`/verify-identity/${accountId}/${txId}`)}
                    className="mt-3 w-full bg-yellow-500 text-white font-bold py-2 rounded-md hover:bg-yellow-600 transition duration-200"
                >
                    Verify Your Identity
                </button>
            </div>
        )}
        
        {(transaction.status === 'Pending' && !transaction.reason) && (
             <div className={`${statusInfo.bgColor} border-l-4 ${statusInfo.borderColor} ${statusInfo.color} p-4 rounded-b-lg shadow-sm -mt-2`}>
                <p className="font-bold">Verification Under Review</p>
                <p className="text-sm">Your identity verification has been submitted and is currently under review. You will receive a notification once the review is complete.</p>
            </div>
        )}

        {((transaction.status === 'Pending' || transaction.status === 'Processing')) && transaction.reason && (
             <div className={`${statusInfo.bgColor} border-l-4 ${statusInfo.borderColor} ${statusInfo.color} p-4 rounded-b-lg shadow-sm -mt-2`}>
                <p className="font-bold">{transaction.reason.title}</p>
                <p className="text-sm">{transaction.reason.message}</p>
                <p className="text-sm mt-2 font-semibold">Please check your notifications for an email link to resolve this issue.</p>
            </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
            <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">Merchant:</span>
                <span className="font-medium text-right">{transaction.merchant}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">Posted Date:</span>
                <span className="font-medium">{new Date(transaction.postedDate).toLocaleDateString()}</span>
            </div>
             <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">Category:</span>
                <span className="font-medium capitalize">{transaction.category}</span>
            </div>
            <div className="flex justify-between py-3">
                <span className="text-gray-500">Running Balance:</span>
                <span className="font-medium">{transaction.status !== 'Completed' ? 'N/A' : formatCurrency(transaction.runningBalance)}</span>
            </div>
        </div>
        
         <div className="bg-white p-4 rounded-lg shadow-sm mt-4 flex justify-around items-center print:hidden">
            <button onClick={handlePrint} className="flex flex-col items-center text-wells-red font-semibold hover:underline">
                <PrintIcon />
                <span>Print</span>
            </button>
            <button onClick={handleShare} className="flex flex-col items-center text-wells-red font-semibold hover:underline">
                <ShareIcon />
                <span>Share</span>
            </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mt-4 print:hidden">
            <p className="text-center font-semibold text-wells-red hover:underline cursor-pointer">
                Report an issue
            </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionReceiptPage;