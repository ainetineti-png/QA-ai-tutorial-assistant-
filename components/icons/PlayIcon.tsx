
import React from 'react';

export const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 20 20" 
    fill="currentColor" 
    {...props}>
    <path 
        fillRule="evenodd" 
        d="M2 10a8 8 0 1116 0 8 8 0 01-16 0zm6.39-2.908a.75.75 0 01.98-.01l4.25 2.5a.75.75 0 010 1.258l-4.25 2.5a.75.75 0 01-.98-.01v-5.018z" 
        clipRule="evenodd" 
    />
  </svg>
);
