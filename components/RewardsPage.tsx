import React from 'react';
import PageHeader from './PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';

const RewardsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const user = currentUser as User;

  const formatCurrency = (amount: number) => {
    const sign = amount > 0 ? '+' : '';
    return `${sign}${Math.abs(amount).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    })}`;
  };

  if (!user.rewards) {
    return (
       <div className="bg-slate-50 min-h-full">
         <PageHeader title="Wells Fargo Rewards®" />
         <p className="p-4 text-center">No rewards data available.</p>
       </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Wells Fargo Rewards®" />
      <div className="p-4">
        <div className="bg-white p-6 rounded-lg shadow-sm text-center mb-4">
          <p className="text-gray-500 text-sm">Available Cash Rewards</p>
          <p className="text-4xl font-bold text-green-600">{formatCurrency(user.rewards.balance)}</p>
          <button className="mt-4 w-full bg-wells-red text-white font-bold py-3 rounded-md hover:bg-wells-dark-red transition duration-300">
            Redeem Rewards
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <h3 className="p-4 font-semibold text-lg border-b">Recent Activity</h3>
          <ul>
            {user.rewards.activity.map((activity, index) => (
              <li key={index} className="flex justify-between items-center p-4 border-b last:border-b-0">
                <div>
                  <p className="font-medium text-gray-800">{activity.description}</p>
                  <p className="text-sm text-gray-500">{activity.date}</p>
                </div>
                <p className={`font-semibold ${activity.amount > 0 ? 'text-green-600' : 'text-gray-800'}`}>
                  {formatCurrency(activity.amount)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mt-4">
            <h3 className="font-semibold text-lg mb-2">Ways to Use Your Rewards</h3>
            <p className="text-sm text-wells-red hover:underline cursor-pointer py-2">Redeem for purchases</p>
            <p className="text-sm text-wells-red hover:underline cursor-pointer py-2">Get cash back</p>
            <p className="text-sm text-wells-red hover:underline cursor-pointer py-2">Redeem for gift cards</p>
        </div>

      </div>
    </div>
  );
};

export default RewardsPage;