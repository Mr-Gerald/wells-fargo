import React from 'react';
import PageHeader from './PageHeader';

const CreditCardsPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Credit Cards" />
      <div className="p-4 space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold text-wells-red mb-2">Find the Right Card for You</h2>
          <p className="text-gray-600 mb-4">Compare our credit cards to find the best fit for your spending habits and financial goals. Earn rewards, enjoy valuable benefits, and more.</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-lg">Wells Fargo Active Cash® Card</h3>
            <p className="text-gray-600 my-2">Unlimited 2% cash rewards on purchases.</p>
            <button className="w-full bg-wells-red text-white font-bold py-2 rounded-md hover:bg-wells-dark-red transition duration-300">Learn More</button>
        </div>
         <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-bold text-lg">Wells Fargo Autograph℠ Card</h3>
            <p className="text-gray-600 my-2">Unlimited 3X points on restaurants, travel, gas, and more.</p>
            <button className="w-full bg-wells-red text-white font-bold py-2 rounded-md hover:bg-wells-dark-red transition duration-300">Learn More</button>
        </div>

      </div>
    </div>
  );
};

export default CreditCardsPage;
