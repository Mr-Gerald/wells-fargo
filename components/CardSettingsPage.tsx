import React from 'react';
import PageHeader from './PageHeader';
import { Link } from 'react-router-dom';

const SettingItem: React.FC<{ to: string; title: string; description: string }> = ({ to, title, description }) => (
    <Link to={to} className="block bg-white p-4 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
    </Link>
);

const CardSettingsPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Card Settings" />
      <div className="p-4 space-y-4">
        <SettingItem 
            to="#" 
            title="Digital Wallet"
            description="Add your card to Apple Pay, Google Pay, etc."
        />
         <SettingItem 
            to="#" 
            title="Turn Card On/Off"
            description="Temporarily disable your card to prevent usage."
        />
         <SettingItem 
            to="#" 
            title="Set Travel Plans"
            description="Notify us of your travel dates to avoid issues."
        />
         <SettingItem 
            to="#" 
            title="Replace Lost or Stolen Card"
            description="Immediately request a new card."
        />
         <SettingItem 
            to="#" 
            title="View PIN"
            description="Securely view your current PIN."
        />
      </div>
    </div>
  );
};

export default CardSettingsPage;
