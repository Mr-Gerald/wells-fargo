import React from 'react';
import PageHeader from './PageHeader';

interface PlaceholderPageProps {
  title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
  return (
    <div className="bg-slate-50 min-h-full">
      <PageHeader title={title} />
      <div className="p-8 text-center text-gray-500">
        <h2 className="text-xl font-semibold mb-2">{title}</h2>
        <p>This is a placeholder page.</p>
        <p>Functionality for this section would be built out here.</p>
      </div>
    </div>
  );
};

export default PlaceholderPage;