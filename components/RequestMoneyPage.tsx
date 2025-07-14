import React from 'react';
import PageHeader from './PageHeader';

const RequestMoneyPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Request Money" />
      <div className="p-4 space-y-6">
        <div>
          <label htmlFor="requester" className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <input
            type="text"
            id="requester"
            placeholder="Enter name, email, or U.S. mobile number"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red"
          />
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

        <div>
          <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">Memo (Optional)</label>
          <input
            type="text"
            id="memo"
            placeholder="What's this for?"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-wells-red"
          />
        </div>

        <div>
            <button
              className="w-full bg-purple-700 text-white font-bold py-3 rounded-md hover:bg-purple-800 transition duration-300"
            >
              Request
            </button>
        </div>
      </div>
    </div>
  );
};

export default RequestMoneyPage;
