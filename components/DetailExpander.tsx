import React from 'react';
import { ChevronDownIcon } from './icons/ChevronDownIcon';

interface DetailExpanderProps {
  onClick: () => void;
  label: string;
}

const DetailExpander: React.FC<DetailExpanderProps> = ({ onClick, label }) => {
  return (
    <div className="flex justify-center mt-4">
      <button
        onClick={onClick}
        className="group flex items-center gap-2 px-4 py-2 bg-gray-600/50 hover:bg-gray-600 text-gray-300 hover:text-white text-sm font-medium rounded-full transition-all duration-200 border border-transparent hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
      >
        <ChevronDownIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-y-0.5" />
        {label}
      </button>
    </div>
  );
};

export default DetailExpander;