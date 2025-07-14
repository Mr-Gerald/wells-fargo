import React from 'react';

const SplashScreen: React.FC = () => {
    return (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
            <div className="text-3xl font-bold text-wells-red tracking-wider animate-pulse">
                WELLS FARGO
            </div>
        </div>
    );
};

export default SplashScreen;