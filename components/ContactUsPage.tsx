import React from 'react';
import PageHeader from './PageHeader';

const ContactUsPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Contact Us" />
      <div className="p-4 space-y-4">
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-2">General Banking</h3>
            <p className="text-gray-600">For questions about your accounts.</p>
            <a href="tel:1-800-869-3557" className="text-wells-red font-semibold text-lg hover:underline">1-800-TO-WELLS (1-800-869-3557)</a>
            <p className="text-sm text-gray-500 mt-1">24 hours a day, 7 days a week</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="font-bold text-lg text-gray-800 mb-2">Online & Mobile Banking</h3>
            <p className="text-gray-600">For technical support.</p>
            <a href="tel:1-800-956-4442" className="text-wells-red font-semibold text-lg hover:underline">1-800-956-4442</a>
             <p className="text-sm text-gray-500 mt-1">24 hours a day, 7 days a week</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <button className="w-full bg-wells-red text-white font-bold py-3 rounded-md hover:bg-wells-dark-red transition duration-300">
                Schedule an Appointment
            </button>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;
