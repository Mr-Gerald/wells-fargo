import React from 'react';
import PageHeader from './PageHeader';
import { Link } from 'react-router-dom';

const ServiceItem: React.FC<{ to: string; title: string }> = ({ to, title }) => (
    <Link to={to} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400">&gt;</span>
    </Link>
);

const AccountServicesPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Account Services" />
      <div className="p-4 space-y-3">
        <ServiceItem to="#" title="Order Checks" />
        <ServiceItem to="#" title="Stop Payment on a Check" />
        <ServiceItem to="#" title="View/Manage Statements" />
        <ServiceItem to="#" title="Set Up Direct Deposit" />
        <ServiceItem to="#" title="Request a Balance Transfer" />
      </div>
    </div>
  );
};

export default AccountServicesPage;
