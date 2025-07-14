
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
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/accounts/${accountId}/transactions/${txId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Transaction not found');
        }
        const data = await response.json();
        setTransaction(data.transaction);
        setAccount(data.account);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactionDetails();
  }, [accountId, txId]);
  
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
  
  const statusColor = transaction.status === 'On Hold' ? 'text-orange-500' : (transaction.status === 'Pending' ? 'text-blue-500' : 'text-green-600');
  const amountColor = transaction.status === 'On Hold' ? 'text-orange-500' : (transaction.amount > 0 ? 'text-green-600' : 'text-gray-900');

  return (
    <div className="bg-slate-50 min-h-full print:bg-white">
      <PageHeader title="Receipt" />

       {successMessage && (
        <div className="mx-4 mt-2 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-center">
            {successMessage}
        </div>
      )}

      <div className="p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <p className="text-gray-500 text-sm">Amount</p>
            <p className={`text-4xl font-bold ${amountColor}`}>{formatCurrency(transaction.amount)}</p>
            <p className={`mt-2 font-semibold ${statusColor}`}>
                {transaction.status}
            </p>
        </div>

        {transaction.status === 'On Hold' && (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-b-lg shadow-sm -mt-2">
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

        {transaction.status === 'Pending' && (
             <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded-b-lg shadow-sm -mt-2">
                <p className="font-bold">Verification Under Review</p>
                <p className="text-sm">Your identity verification has been submitted and is currently under review. You will receive a notification once the review is complete.</p>
            </div>
        )}

        <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
            <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">Merchant:</span>
                <span className="font-medium text-right">{transaction.merchant}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
                <span className="text-gray-500">Posted Date:</span>
                <span className="font-medium">{transaction.postedDate}</span>
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