import React from 'react';
import { Link } from 'react-router-dom';
import { StarIcon } from '../constants';

const BonusPointsCard: React.FC = () => {
  return (
    <Link to="/bonus-points" className="bg-white p-4 rounded-lg shadow-sm flex items-center space-x-4">
      <div className="bg-yellow-100 p-2 rounded-full">
        <StarIcon />
      </div>
      <div className="flex-1">
        <p className="font-bold text-gray-800">Earn 20k bonus points</p>
      </div>
      <span className="text-gray-400 text-lg">&gt;</span>
    </Link>
  );
};

export default BonusPointsCard;