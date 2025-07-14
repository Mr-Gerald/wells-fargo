import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from './PageHeader';

const MenuItem: React.FC<{ children: React.ReactNode; to: string; }> = ({ children, to }) => (
    <Link to={to} className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 flex justify-between items-center transition-colors">
        <span className="font-semibold">{children}</span>
        <span className="text-gray-400">&gt;</span>
    </Link>
);

const MenuPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Menu" />
      <div className="p-4 space-y-4">
        <MenuItem to="/menu/profile">Profile</MenuItem>
        <MenuItem to="/menu/alerts">Alerts</MenuItem>
        <MenuItem to="/menu/card-settings">Card Settings</MenuItem>
        <MenuItem to="/menu/security">Security & Fraud</MenuItem>
        <MenuItem to="/menu/account-services">Account Services</MenuItem>
        <MenuItem to="/menu/contact-us">Contact Us</MenuItem>
        <MenuItem to="/menu/open-account">Open an Account</MenuItem>
      </div>
    </div>
  );
};

export default MenuPage;