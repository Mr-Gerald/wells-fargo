
import React from 'react';

interface ReviewTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    details: {
        fromAccountName: string;
        fromAccountSuffix: string;
        toName: string;
        amount: string;
        type: string;
    } | null;
    loading: boolean;
}

const ReviewTransferModal: React.FC<ReviewTransferModalProps> = ({ isOpen, onClose, onConfirm, details, loading }) => {
    if (!isOpen || !details) return null;

    const formatCurrency = (amountStr: string) => {
        const amount = parseFloat(amountStr);
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in" onClick={!loading ? onClose : undefined}>
            <div className="bg-white rounded-lg shadow-xl w-11/12 max-w-sm" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold text-gray-800">Review Your Transfer</h2>
                    <button onClick={!loading ? onClose : undefined} className="text-gray-500 hover:text-gray-800 text-2xl font-bold" disabled={loading}>&times;</button>
                </header>
                <main className="p-4 space-y-3">
                    <div className="flex justify-between">
                        <span className="text-gray-500">From:</span>
                        <span className="font-medium text-right">{details.fromAccountName} ...{details.fromAccountSuffix}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500">To:</span>
                        <span className="font-medium text-right">{details.toName}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500">Amount:</span>
                        <span className="font-bold text-lg text-gray-900">{formatCurrency(details.amount)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium text-right capitalize">{details.type}</span>
                    </div>
                    <p className="text-xs text-gray-500 pt-2">
                        By confirming, you authorize this transfer. Please review the details carefully as this action may not be reversible.
                    </p>
                </main>
                <footer className="p-4 border-t">
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="w-full bg-wells-red text-white font-bold py-3 rounded-md hover:bg-wells-dark-red transition duration-300 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processing...' : 'Confirm Transfer'}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ReviewTransferModal;