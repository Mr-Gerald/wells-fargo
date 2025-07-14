import React from 'react';
import PageHeader from './PageHeader';

const AutoLoansPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Auto Loans" />
      <div className="p-4 space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-bold text-wells-red mb-2">Get in the Driver's Seat</h2>
          <p className="text-gray-600 mb-4">Finance your new or used car with a competitive rate from a lender you can trust.</p>
          <img 
            src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=800&auto=format&fit=crop"
            alt="Red sports car"
            className="rounded-lg mb-4"
          />
           <button className="w-full bg-wells-red text-white font-bold py-3 rounded-md hover:bg-wells-dark-red transition duration-300">
                Apply Now
            </button>
        </div>
         <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-semibold text-lg">Why choose Wells Fargo?</h3>
            <ul className="list-disc list-inside text-gray-600 mt-2 space-y-1">
                <li>Competitive, fixed rates</li>
                <li>Flexible repayment terms</li>
                <li>No application fee or prepayment penalty</li>
                <li>Easy online application</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default AutoLoansPage;
