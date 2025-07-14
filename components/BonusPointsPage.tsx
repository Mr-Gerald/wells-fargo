import React, { useState } from 'react';
import PageHeader from './PageHeader';
import { StarIcon } from '../constants';

const BonusPointsPage: React.FC = () => {
    const [isOfferActivated, setIsOfferActivated] = useState(false);

    const handleActivate = () => {
        setIsOfferActivated(true);
    };

    return (
        <div className="bg-slate-50 min-h-full">
            <PageHeader title="Bonus Points Offer" />
            <div className="p-4">
                <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <StarIcon />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Earn 20,000 Bonus Points</h2>
                    <p className="text-gray-600 my-3">
                        That's a <span className="font-bold">$200 cash redemption value</span> when you spend $1,000 in purchases in the first 3 months.
                    </p>
                    
                    {isOfferActivated ? (
                        <div className="mt-4 p-3 bg-green-100 text-green-800 font-semibold rounded-md">
                            Offer Activated!
                        </div>
                    ) : (
                         <button 
                            onClick={handleActivate}
                            className="w-full bg-wells-red text-white font-bold py-3 rounded-md hover:bg-wells-dark-red transition duration-300 mt-4"
                         >
                            Activate Offer
                        </button>
                    )}
                </div>
                <div className="text-xs text-gray-500 mt-4">
                    <h4 className="font-semibold mb-1">Terms and Conditions</h4>
                    <p>This product is not available to either (i) current cardmembers of this credit card, or (ii) previous cardmembers of this credit card who received a new cardmember bonus for this credit card within the last 24 months. You may not be eligible for this offer if you currently have or previously had an account with us in this Program.</p>
                </div>
            </div>
        </div>
    );
};

export default BonusPointsPage;