import React from 'react';
import { Link } from 'react-router-dom';
import PageHeader from './PageHeader';

const ExploreItem: React.FC<{ children: React.ReactNode; to: string; description: string; }> = ({ children, to, description }) => (
    <Link to={to} className="block bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
        <h2 className="font-bold text-lg text-wells-red">{children}</h2>
        <p className="text-sm text-gray-600">{description}</p>
    </Link>
);

const ExplorePage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Explore Products" />
      <div className="p-4 space-y-4">
        <ExploreItem to="/explore/mortgage" description="Find the right home loan for your needs.">
          Mortgage & Home Loans
        </ExploreItem>
        <ExploreItem to="/explore/auto-loans" description="Finance your next car with competitive rates.">
          Auto Loans
        </ExploreItem>
        <ExploreItem to="/explore/credit-cards" description="Compare cards to find the right one for you.">
          Credit Cards
        </ExploreItem>
        <ExploreItem to="/explore/investing" description="Plan for your future with our investment options.">
          Investing by Wells Fargo
        </ExploreItem>
      </div>
    </div>
  );
};

export default ExplorePage;