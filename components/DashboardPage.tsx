
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Account, User } from '../types';
import FicoScoreCard from './FicoScoreCard';
import BonusPointsCard from './BonusPointsCard';
import Header from './Header';

const AccountCard: React.FC<{ account: Account }> = ({ account }) => {
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  return (
    <Link to={`/account/${account.id}`} className="block bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 mb-4">
      <div className="flex justify-between items-center mb-1">
        <h3 className="font-semibold text-gray-700 text-sm">{account.name} ...{account.numberSuffix}</h3>
        <span className="text-gray-500 text-sm">&gt;</span>
      </div>
      <p className="text-3xl font-normal text-gray-900 tracking-tight">{formatCurrency(account.balance)}</p>
      <p className="text-xs text-gray-500">{account.subText}</p>
    </Link>
  );
};

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const user = currentUser as User;

  if (!user || !user.accounts) {
    return <div>Loading...</div>;
  }
  
  // Show extra cards if the user has rewards activity, making it work for Alex and his clones.
  const showExtraCards = user.rewards && user.rewards.activity && user.rewards.activity.length > 0;

  return (
    <div className="bg-gradient-to-b from-wells-gradient-start to-wells-gradient-end min-h-full">
      <Header />
      <div className="p-4">
        <div>
          {user.accounts.map(account => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
        
        <div className="mt-8">
          <Link to="/menu/open-account" className="flex items-center space-x-2 text-purple-700 font-semibold">
            <div className="h-6 w-6 rounded-full bg-purple-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span>Open new account</span>
          </Link>
        </div>
        
        {showExtraCards && (
          <div className="mt-8 space-y-6">
              <Link to="/fico-score">
                  <FicoScoreCard />
              </Link>
              <BonusPointsCard />
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;