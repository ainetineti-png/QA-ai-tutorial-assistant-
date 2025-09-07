import React from 'react';
import { ResourceLinkInfo } from '../types';
import { WebsiteIcon } from './icons/WebsiteIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';

interface ResourceLinkProps {
  link: ResourceLinkInfo;
  type: 'website' | 'youtube';
}

const ResourceLink: React.FC<ResourceLinkProps> = ({ link, type }) => {
  const Icon = type === 'youtube' ? YouTubeIcon : WebsiteIcon;
  const hoverColor = type === 'youtube' ? 'hover:bg-red-900/50' : 'hover:bg-gray-600';

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 p-2 rounded-md transition-colors duration-200 ${hoverColor}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${type === 'youtube' ? 'text-red-500' : 'text-gray-400'}`} />
      <span className="text-sm text-gray-300 hover:text-white truncate" title={link.title}>
        {link.title}
      </span>
    </a>
  );
};

export default ResourceLink;
