import React from 'react';
import { useNavigate } from 'react-router-dom';

export const BackArrowIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
);

interface PageHeaderProps {
  title: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white p-4 sticky top-0 z-20 border-b border-gray-200 flex items-center">
      <button onClick={() => navigate(-1)} className="mr-4 p-1 rounded-full hover:bg-gray-100">
        <BackArrowIcon />
      </button>
      <h1 className="font-bold text-lg text-gray-800">{title}</h1>
    </header>
  );
};

export default PageHeader;