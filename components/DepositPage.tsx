import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from './PageHeader';

const DepositPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Deposit" />
      <div className="p-4 space-y-4">
        <Link to="/deposit/check" className="block bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <h2 className="font-bold text-lg">Deposit a check</h2>
          <p className="text-sm text-gray-600">Use your camera to deposit a check.</p>
        </Link>
        <Link to="/deposit/atm" className="block bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <h2 className="font-bold text-lg">Find an ATM</h2>
          <p className="text-sm text-gray-600">Locate a nearby Wells Fargo ATM for cash deposits.</p>
        </Link>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h3 className="font-semibold mb-2">Deposit Limits</h3>
          <p className="text-sm text-gray-600">Daily: $50,000.00</p>
          <p className="text-sm text-gray-600">Monthly: $250,000.00</p>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;