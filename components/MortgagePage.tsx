import React from 'react';
import PageHeader from './PageHeader';

const MortgagePage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Mortgage & Home Loans" />
      <div className="p-4 space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold text-wells-red mb-2">Achieve Your Homeownership Goals</h2>
          <p className="text-gray-600 mb-4">Whether you're buying your first home, refinancing, or tapping into your home's equity, we have a solution for you.</p>
          <img 
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=800&auto=format&fit=crop"
            alt="Happy couple in a new home"
            className="rounded-lg mb-4"
          />
           <button className="w-full bg-wells-red text-white font-bold py-3 rounded-md hover:bg-wells-dark-red transition duration-300">
                Get Pre-Qualified
            </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg">Our Loan Options</h3>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li>Fixed-Rate Mortgages</li>
                <li>Adjustable-Rate Mortgages (ARM)</li>
                <li>Jumbo Loans</li>
                <li>FHA, VA, and USDA Loans</li>
                <li>Home Equity Line of Credit (HELOC)</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default MortgagePage;
