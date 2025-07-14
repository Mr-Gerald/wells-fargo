import React from 'react';
import PageHeader from './PageHeader';

const InvestingPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Investing by Wells Fargo" />
       <div className="p-4 space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold text-wells-red mb-2">Invest for Your Future</h2>
          <p className="text-gray-600 mb-4">Whether you're new to investing or an experienced trader, we have the tools and resources to help you succeed.</p>
           <button className="w-full bg-wells-red text-white font-bold py-3 rounded-md hover:bg-wells-dark-red transition duration-300">
                Explore Our Platforms
            </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg">Ways to Invest</h3>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li><span className="font-semibold">WellsTrade® Online Brokerage:</span> Self-directed trading with powerful tools.</li>
                <li><span className="font-semibold">Intuitive Investor®:</span> A robo-advisor that invests for you.</li>
                <li><span className="font-semibold">Dedicated Financial Advisor:</span> Personalized guidance and a comprehensive plan.</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default InvestingPage;
