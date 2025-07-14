import React from 'react';
import PageHeader from './PageHeader';

const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-wells-red" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
);

const atms = [
    { name: 'Wells Fargo Branch', address: '123 Main St, San Francisco, CA', distance: '0.2 mi' },
    { name: 'Wells Fargo ATM', address: '456 Market St, San Francisco, CA', distance: '0.5 mi' },
    { name: 'Wells Fargo ATM - In Store', address: '789 Mission St, San Francisco, CA', distance: '0.8 mi' },
];

const FindAtmPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full flex flex-col">
      <PageHeader title="Find an ATM or Branch" />
      <div>
        <img 
            src="https://maps.googleapis.com/maps/api/staticmap?center=San+Francisco&zoom=13&size=600x300&maptype=roadmap&markers=color:red%7Clabel:W%7C37.7749,-122.4194&key=dummy_key"
            alt="Map of ATMs"
            className="w-full h-48 object-cover"
        />
      </div>
      <div className="p-4 space-y-4 flex-1">
        {atms.map((atm, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm flex items-start space-x-4">
                <div className="flex-shrink-0 pt-1">
                    <LocationIcon />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">{atm.name}</h3>
                    <p className="text-sm text-gray-600">{atm.address}</p>
                    <p className="text-sm font-semibold text-gray-800">{atm.distance}</p>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
};

export default FindAtmPage;
