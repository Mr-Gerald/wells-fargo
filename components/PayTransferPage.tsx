import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from './PageHeader';

const PayTransferPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Pay & Transfer" />
      <div className="p-4 space-y-4">
        <Link to="/pay-transfer/zelle" className="block bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <h2 className="font-bold text-lg text-purple-700">Send Money with Zelle®</h2>
          <p className="text-sm text-gray-600">A fast, safe and easy way to send money.</p>
        </Link>
        <Link to="/pay-transfer/transfer" className="block bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <h2 className="font-bold text-lg">Transfer Money</h2>
          <p className="text-sm text-gray-600">Move money between your Wells Fargo accounts or to an external account.</p>
        </Link>
        <Link to="/pay-transfer/bills" className="block bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <h2 className="font-bold text-lg">Pay Bills</h2>
          <p className="text-sm text-gray-600">Manage your payees and schedule payments.</p>
        </Link>
         <Link to="/pay-transfer/request" className="block bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
          <h2 className="font-bold text-lg">Request Money</h2>
          <p className="text-sm text-gray-600">Request money from others using Zelle®.</p>
        </Link>
      </div>
    </div>
  );
};

export default PayTransferPage;