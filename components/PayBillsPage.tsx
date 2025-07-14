import React from 'react';
import PageHeader from './PageHeader';

const payees = [
    { name: 'PG&E - Gas & Electric', due: '07/20/2024', amount: '150.78' },
    { name: 'Comcast Xfinity', due: '07/25/2024', amount: '99.99' },
    { name: 'City of SF - Water', due: '08/01/2024', amount: '85.50' },
];

const PayBillsPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Pay Bills" />
      <div className="p-4 space-y-4">
        <div className="text-right mb-4">
            <button className="font-semibold text-wells-red hover:underline">+ Add Payee</button>
        </div>

        {payees.map((payee, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-gray-800">{payee.name}</h3>
                        <p className="text-sm text-gray-600">Due {payee.due}</p>
                        <p className="text-sm font-semibold text-gray-800">${payee.amount}</p>
                    </div>
                    <button className="bg-wells-red text-white font-bold py-2 px-6 rounded-md hover:bg-wells-dark-red transition duration-300">
                        Pay
                    </button>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default PayBillsPage;
