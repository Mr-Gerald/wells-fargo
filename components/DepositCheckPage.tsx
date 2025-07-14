import React from 'react';
import PageHeader from './PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { User, AccountType } from '../types';

const CameraIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const DepositCheckPage: React.FC = () => {
  const { currentUser } = useAuth();
  const user = currentUser as User;

  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Deposit a Check" />
      <div className="p-4 space-y-6">
        <div>
          <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-1">Deposit to</label>
          <select id="account" className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red">
            {user.accounts.map(account => (
              (account.type !== AccountType.CASH_CARD) &&
              <option key={account.id}>{account.name} ...{account.numberSuffix}</option>
            ))}
          </select>
        </div>

        <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">$</div>
                <input
                    type="number"
                    id="amount"
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red"
                />
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
            <button className="bg-white p-4 rounded-lg shadow-sm text-center border-2 border-dashed border-gray-300 hover:border-wells-red">
                <CameraIcon />
                <p className="font-semibold text-gray-700">Front of Check</p>
                <p className="text-xs text-gray-500">Tap to capture</p>
            </button>
            <button className="bg-white p-4 rounded-lg shadow-sm text-center border-2 border-dashed border-gray-300 hover:border-wells-red">
                <CameraIcon />
                <p className="font-semibold text-gray-700">Back of Check</p>
                <p className="text-xs text-gray-500">Tap to capture</p>
            </button>
        </div>

        <div>
            <button
              className="w-full bg-wells-red text-white font-bold py-3 rounded-md hover:bg-wells-dark-red transition duration-300"
            >
              Deposit
            </button>
        </div>

        <div className="text-xs text-gray-500">
            <p>Checks deposited before 9 PM PT on a business day will generally be available the next business day. Checks are subject to verification.</p>
        </div>
      </div>
    </div>
  );
};

export default DepositCheckPage;