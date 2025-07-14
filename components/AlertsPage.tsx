import React, { useState } from 'react';
import PageHeader from './PageHeader';

const Toggle: React.FC<{ enabled: boolean, onChange: (enabled: boolean) => void }> = ({ enabled, onChange }) => {
    return (
        <button
            onClick={() => onChange(!enabled)}
            className={`${enabled ? 'bg-green-600' : 'bg-gray-200'} relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out`}
        >
            <span
                className={`${enabled ? 'translate-x-6' : 'translate-x-1'} inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out`}
            />
        </button>
    );
};

const AlertItem: React.FC<{ label: string }> = ({ label }) => {
    const [isEnabled, setIsEnabled] = useState(false);
    return (
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
            <span className="font-medium text-gray-800">{label}</span>
            <Toggle enabled={isEnabled} onChange={setIsEnabled} />
        </div>
    );
};

const AlertsPage: React.FC = () => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title="Alerts" />
      <div className="p-4 space-y-4">
        <div>
            <h3 className="font-bold text-lg text-gray-700 mb-2">Account Alerts</h3>
            <div className="space-y-2">
                <AlertItem label="Low Balance" />
                <AlertItem label="Large Deposit" />
                <AlertItem label="Large Withdrawal" />
            </div>
        </div>
         <div>
            <h3 className="font-bold text-lg text-gray-700 mb-2">Security Alerts</h3>
            <div className="space-y-2">
                <AlertItem label="Unusual Card Activity" />
                <AlertItem label="Password Change" />
                <AlertItem label="New Device Sign On" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
