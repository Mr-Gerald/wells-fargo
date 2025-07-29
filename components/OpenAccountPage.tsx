import React from 'react';
import PageHeader from './PageHeader';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

const AccountTypeItem: React.FC<{ to: string; title: string, description: string }> = ({ to, title, description }) => (
    <Link to={to} className="block bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
        <h3 className="font-bold text-lg text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
    </Link>
);

const OpenAccountPage: React.FC = () => {
  const { currentUser } = useAuth();
  const user = currentUser as User;

  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Open an Account" />
      <div className="p-4 space-y-4">
        {user.id === 'user-1' && (
          <AccountTypeItem 
              to="/menu/create-instant-account"
              title="Create Instant Account"
              description="Generate a new demo account with custom details."
          />
        )}
        <AccountTypeItem 
            to="#"
            title="Checking Accounts"
            description="Find the perfect checking account for your needs."
        />
        <AccountTypeItem 
            to="#"
            title="Savings Accounts & CDs"
            description="Grow your money with our savings options."
        />
         <AccountTypeItem 
            to="#"
            title="Credit Cards"
            description="Explore cards with great rewards and benefits."
        />
        <AccountTypeItem 
            to="#"
            title="Investing and Retirement"
            description="Plan for your future with professional guidance."
        />
      </div>
    </div>
  );
};

export default OpenAccountPage;