import React from 'react';

const FicoScoreCard: React.FC = () => {
    const score = 820;
    
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4">
            <div className="relative w-16 h-16">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                    <path
                        className="text-gray-200"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                        className="text-green-500"
                        strokeWidth="3"
                        strokeDasharray="90, 100"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-gray-800">{score}</span>
                </div>
            </div>
            <div className="flex-1">
                <p className="font-semibold text-gray-800">Your FICO® Score went up 10 points</p>
                <p className="text-sm text-gray-500">Updated 04/19/2024</p>
            </div>
            <span className="text-gray-400 text-lg">&gt;</span>
        </div>
    );
};

export default FicoScoreCard;