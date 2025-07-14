import React from 'react';
import PageHeader from './PageHeader';
import { Link } from 'react-router-dom';

const SecurityItem: React.FC<{ to: string; title: string }> = ({ to, title }) => (
    <Link to={to} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
        <span className="font-semibold text-gray-800">{title}</span>
        <span className="text-gray-400">&gt;</span>
    </Link>
);

const SecurityPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Security & Fraud" />
      <div className="p-4 space-y-3">
        <SecurityItem to="#" title="Update Username" />
        <SecurityItem to="#" title="Update Password" />
        <SecurityItem to="#" title="Manage 2-Step Verification" />
        <SecurityItem to="#" title="View Sign-On History" />
        <SecurityItem to="#" title="Security Center" />
        <SecurityItem to="#" title="Report Fraud" />
      </div>
    </div>
  );
};

export default SecurityPage;
