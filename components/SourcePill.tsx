
import React from 'react';
import { Source } from '../types';
import { SourceIcon } from './icons/SourceIcon';

interface SourcePillProps {
  source: Source;
  index: number;
}

const SourcePill: React.FC<SourcePillProps> = ({ source, index }) => {
  return (
    <a
      href={source.uri}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center bg-gray-600 hover:bg-gray-500 text-gray-200 text-xs font-medium px-3 py-1 rounded-full transition-colors duration-200"
      title={source.uri}
    >
      <SourceIcon className="w-3 h-3 mr-1.5" />
      <span className="bg-gray-800 text-gray-300 rounded-full w-4 h-4 flex items-center justify-center mr-2 text-[10px]">{index}</span>
      <span className="truncate max-w-[200px]">{source.title || new URL(source.uri).hostname}</span>
    </a>
  );
};

export default SourcePill;
